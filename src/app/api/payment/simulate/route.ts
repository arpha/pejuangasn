import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user from Bearer Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing authorization header' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Parse transaction ID
    const body = await req.json().catch(() => ({}));
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    // 3. Fetch transaction to confirm ownership
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only pending transactions can be simulated' }, { status: 400 });
    }

    // 4. Initialize Supabase Admin client to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 5. Update transaction locally to SUCCESS
    const { error: updateTxError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'SUCCESS' })
      .eq('id', transactionId);

    if (updateTxError) {
      console.error('Failed to update transaction in simulation:', updateTxError);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    // 6. If transaction succeeded, upgrade the user subscription status to PREMIUM or auto-enroll in package
    if (transaction.package_id) {
      // Auto-enroll user in the purchased package
      const { error: enrollError } = await supabaseAdmin
        .from('package_enrollments')
        .insert({
          user_id: transaction.user_id,
          package_id: transaction.package_id
        });

      if (enrollError) {
        console.error('Failed to auto-enroll user after successful payment simulation:', enrollError);
        return NextResponse.json({ error: 'Failed to auto-enroll user in package' }, { status: 500 });
      }
      console.log(`Successfully enrolled user ${transaction.user_id} in package ${transaction.package_id} via simulated transaction ${transactionId}`);
    } else {
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'PREMIUM' })
        .eq('id', user.id);

      if (updateProfileError) {
        console.error('Failed to upgrade user profile in simulation:', updateProfileError);
        return NextResponse.json({ error: 'Failed to upgrade profile' }, { status: 500 });
      }
      console.log(`Successfully upgraded user ${user.id} to PREMIUM via simulated transaction ${transactionId}`);
    }

    // Increment voucher usage if a voucher was applied
    if (transaction.voucher_code) {
      try {
        const { data: vData } = await supabaseAdmin
          .from('vouchers')
          .select('id, used_count')
          .eq('code', transaction.voucher_code)
          .maybeSingle();

        if (vData) {
          await supabaseAdmin
            .from('vouchers')
            .update({ used_count: (vData.used_count || 0) + 1 })
            .eq('id', vData.id);
          console.log(`[Simulation] Incremented usage count for voucher: ${transaction.voucher_code}`);
        }
      } catch (err: any) {
        console.error('[Simulation] Error incrementing voucher count:', err.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Simulation API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
