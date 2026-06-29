import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
      return NextResponse.json({ error: 'Only pending transactions can be cancelled' }, { status: 400 });
    }

    // 4. Update status locally to FAILED using service role client (bypasses RLS UPDATE restriction)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'FAILED' })
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .eq('title', 'Upgrade Keanggotaan PREMIUM');

    if (updateError) {
      console.error('Failed to cancel transaction in database:', updateError);
      return NextResponse.json({ error: 'Failed to update transaction status' }, { status: 500 });
    }

    // 5. Cancel in Midtrans if serverKey exists
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const isProduction = 
      process.env.MIDTRANS_IS_PRODUCTION === 'true' || 
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

    if (serverKey) {
      const midtransBaseUrl = isProduction 
        ? `https://api.midtrans.com/v2/${transactionId}/cancel` 
        : `https://api.sandbox.midtrans.com/v2/${transactionId}/cancel`;

      const authString = Buffer.from(`${serverKey}:`).toString('base64');

      try {
        const midtransResponse = await fetch(midtransBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${authString}`
          }
        });
        const midtransData = await midtransResponse.json();
        console.log('Midtrans cancel response:', midtransData);
      } catch (err) {
        console.error('Error calling Midtrans cancel API:', err);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Cancel API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
