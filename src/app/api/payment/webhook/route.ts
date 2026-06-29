import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Received Midtrans Webhook Notification:', payload);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type
    } = payload;

    // 1. Verify Signature Key with multiple formatting fallbacks
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    
    // Parse gross_amount to handle decimal / string format mismatches
    const rawGross = String(gross_amount);
    const parsedNum = Number(gross_amount);
    const formattedGross = !isNaN(parsedNum) ? parsedNum.toFixed(2) : rawGross;
    const integerGross = !isNaN(parsedNum) ? String(Math.floor(parsedNum)) : rawGross;

    const signatureSources = [
      `${order_id}${status_code}${rawGross}${serverKey}`,
      `${order_id}${status_code}${formattedGross}${serverKey}`,
      `${order_id}${status_code}${integerGross}${serverKey}`
    ];

    const isSignatureValid = signatureSources.some(source => {
      const calculated = crypto
        .createHash('sha512')
        .update(source)
        .digest('hex');
      return calculated === signature_key;
    });

    if (!isSignatureValid) {
      console.error('Invalid Midtrans Webhook Signature Key:', {
        receivedSignature: signature_key,
        orderId: order_id,
        statusCode: status_code,
        grossAmountReceived: gross_amount,
        serverKeyUsed: serverKey ? `${serverKey.substring(0, 5)}...` : 'undefined',
        testedSources: signatureSources
      });
      
      // During development/sandbox testing, if signature key mismatches, log it but return 401
      // to let the merchant know there is a key mismatch in env variables.
      return NextResponse.json({ 
        error: 'Unauthorized: Invalid signature', 
        debug: {
          message: 'Server Key or Gross Amount format mismatch. Check your MIDTRANS_SERVER_KEY in .env.local.'
        }
      }, { status: 401 });
    }

    // 2. Initialize Supabase Client with Service Role Key (bypasses RLS for server-side state updates)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 3. Find target transaction
    // Check if order_id is a valid UUID to avoid PostgreSQL syntax errors (like 22P02)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) {
      console.log(`Non-UUID order_id received (possibly a test notification or custom format): ${order_id}`);
      return NextResponse.json({ success: true, message: 'Valid request received for non-UUID order format' });
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', order_id)
      .maybeSingle();

    if (txError || !transaction) {
      console.error('Transaction not found in database:', order_id, txError);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // 4. Map Midtrans transaction status to local enum status ('SUCCESS' | 'PENDING' | 'FAILED')
    let newStatus: 'SUCCESS' | 'PENDING' | 'FAILED' = 'PENDING';
    let activatePremium = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'PENDING';
      } else if (fraud_status === 'accept') {
        newStatus = 'SUCCESS';
        activatePremium = true;
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'SUCCESS';
      activatePremium = true;
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      transaction_status === 'cancel'
    ) {
      newStatus = 'FAILED';
    }

    // 5. Update transaction record status and payment method in DB
    const { error: updateTxError } = await supabase
      .from('transactions')
      .update({ 
        status: newStatus,
        payment_method: payment_type || 'MIDTRANS'
      })
      .eq('id', order_id);

    if (updateTxError) {
      console.error('Failed to update transaction status:', updateTxError);
      return NextResponse.json({ error: 'Failed to update transaction status' }, { status: 500 });
    }

    // 6. If transaction succeeded, upgrade the user subscription status to PREMIUM or auto-enroll in package
    if (activatePremium) {
      if (transaction.package_id) {
        // Auto-enroll user in the purchased package
        const { error: enrollError } = await supabase
          .from('package_enrollments')
          .insert({
            user_id: transaction.user_id,
            package_id: transaction.package_id
          });

        if (enrollError) {
          console.error('Failed to auto-enroll user after successful payment:', enrollError);
          return NextResponse.json({ error: 'Failed to auto-enroll user in package' }, { status: 500 });
        }
        console.log(`Successfully enrolled user ${transaction.user_id} in package ${transaction.package_id} via transaction ${order_id}`);
      } else {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'PREMIUM' })
          .eq('id', transaction.user_id);

        if (updateProfileError) {
          console.error('Failed to upgrade user subscription status to PREMIUM:', updateProfileError);
          return NextResponse.json({ error: 'Failed to upgrade user subscription status' }, { status: 500 });
        }
        console.log(`Successfully upgraded user ${transaction.user_id} to PREMIUM via transaction ${order_id}`);
      }

      // Increment voucher usage if a voucher was applied
      if (transaction.voucher_code) {
        try {
          const { data: vData } = await supabase
            .from('vouchers')
            .select('id, used_count')
            .eq('code', transaction.voucher_code)
            .maybeSingle();

          if (vData) {
            await supabase
              .from('vouchers')
              .update({ used_count: (vData.used_count || 0) + 1 })
              .eq('id', vData.id);
            console.log(`Incremented usage count for voucher: ${transaction.voucher_code}`);
          }
        } catch (err: any) {
          console.error('Error incrementing voucher count in webhook:', err.message);
        }
      }
    } else {
      console.log(`Transaction ${order_id} status updated to ${newStatus}`);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
