import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

    // 2. Fetch user profile for metadata (full name, WhatsApp/phone)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to retrieve user profile' }, { status: 400 });
    }

    // 3. Check if user is already premium
    if (profile.subscription_status === 'PREMIUM') {
      return NextResponse.json({ error: 'User is already a PREMIUM subscriber' }, { status: 400 });
    }

    // 4. Parse payment choices from request body
    const body = await req.json().catch(() => ({}));
    const { paymentType, bank, voucherCode, packageId } = body; // paymentType: 'bank_transfer' | 'qris', bank: 'bca' | 'bni' | 'bri', packageId?: string

    // 3. Check if user is already premium (only for premium upgrades)
    if (!packageId && profile.subscription_status === 'PREMIUM') {
      return NextResponse.json({ error: 'User is already a PREMIUM subscriber' }, { status: 400 });
    }

    if (!paymentType || (paymentType === 'bank_transfer' && !bank)) {
      return NextResponse.json({ error: 'Invalid request: Missing paymentType or bank choice' }, { status: 400 });
    }

    // Cancel any existing PENDING transactions of this type for this user first to prevent duplicates
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    let baseAmount = 149000; // Harga upgrade premium (default)
    let transactionTitle = 'Upgrade Keanggotaan PREMIUM';

    if (packageId) {
      const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (pkgError || !pkg) {
        return NextResponse.json({ error: 'Package not found' }, { status: 404 });
      }

      if (!pkg.price || pkg.price <= 0) {
        return NextResponse.json({ error: 'This package is free and does not require payment' }, { status: 400 });
      }

      baseAmount = pkg.price;
      transactionTitle = `Tiket: ${pkg.title}`;
    }

    if (packageId) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .eq('package_id', packageId);
    } else {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'FAILED' })
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .eq('title', 'Upgrade Keanggotaan PREMIUM');
    }

    // 4.5. Check and Apply Voucher Code if present
    let discountAmount = 0;
    let appliedVoucherCode: string | null = null;

    if (voucherCode) {
      const { data: voucher, error: voucherError } = await supabaseAdmin
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!voucherError && voucher) {
        const isExpired = voucher.valid_until && new Date() > new Date(voucher.valid_until);
        const isLimitReached = voucher.max_usages !== null && voucher.used_count >= voucher.max_usages;

        if (!isExpired && !isLimitReached) {
          appliedVoucherCode = voucher.code;
          if (voucher.discount_percent > 0) {
            discountAmount = Math.floor((baseAmount * voucher.discount_percent) / 100);
          } else if (voucher.discount_nominal > 0) {
            discountAmount = voucher.discount_nominal;
          }
        }
      }
    }

    // 5. Generate transaction ID (UUID) and create PENDING record in DB
    const transactionId = crypto.randomUUID();
    const productPrice = baseAmount - discountAmount;
    const transactionFee = paymentType === 'qris' 
      ? Math.floor(productPrice * 0.007) 
      : 4500;
    const amount = productPrice + transactionFee;
    const paymentMethodLabel = paymentType === 'qris' ? 'QRIS' : (bank || 'bank_transfer').toUpperCase();

    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: user.id,
        package_id: packageId || null,
        title: transactionTitle,
        amount: amount,
        status: 'PENDING',
        payment_method: paymentMethodLabel,
        voucher_code: appliedVoucherCode
      });

    if (dbError) {
      console.error('Error creating transaction in DB:', dbError);
      return NextResponse.json({ error: 'Gagal membuat rekam transaksi' }, { status: 500 });
    }

    // 6. Charge payment via Midtrans Core API
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = 
      process.env.MIDTRANS_IS_PRODUCTION === 'true' || 
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const midtransBaseUrl = isProduction 
      ? 'https://api.midtrans.com/v2/charge' 
      : 'https://api.sandbox.midtrans.com/v2/charge';

    // Simulation Fallback
    if (!serverKey) {
      console.warn('Warning: MIDTRANS_SERVER_KEY is not defined in env. Falling back to Simulation Mode.');
      
      let paymentDetail = '991234567890'; // Simulated VA
      const bankNameStr = bank || '';
      if (paymentType === 'qris') {
        paymentDetail = 'https://api.sandbox.midtrans.com/v2/qris/simulated-qr.png';
      }

      await supabase
        .from('transactions')
        .update({
          payment_detail: paymentDetail,
          bank_name: bankNameStr
        })
        .eq('id', transactionId);

      return NextResponse.json({
        token: 'simulated-token',
        redirect_url: '#',
        transactionId: transactionId,
        isSimulation: true,
        paymentDetail: paymentDetail,
        bankName: bankNameStr,
        paymentType: paymentType
      });
    }

    const authString = Buffer.from(`${serverKey}:`).toString('base64');

    const chargePayload: any = {
      payment_type: paymentType === 'qris' ? 'qris' : 'bank_transfer',
      transaction_details: {
        order_id: transactionId,
        gross_amount: amount
      },
      item_details: (() => {
        const items: any[] = [
          {
            id: 'PREMIUM_UPGRADE',
            price: baseAmount,
            quantity: 1,
            name: 'Upgrade Akun Premium Kawan ASN'
          }
        ];
        if (discountAmount > 0) {
          items.push({
            id: `DISCOUNT_${appliedVoucherCode}`,
            price: -discountAmount,
            quantity: 1,
            name: `Diskon Voucher: ${appliedVoucherCode}`
          });
        }
        items.push({
          id: 'TRANSACTION_FEE',
          price: transactionFee,
          quantity: 1,
          name: paymentType === 'qris' ? 'Biaya Transaksi QRIS' : `Biaya Transaksi VA ${(bank || '').toUpperCase()}`
        });
        return items;
      })(),
      customer_details: {
        first_name: profile.full_name || 'Peserta',
        email: user.email,
        phone: profile.whatsapp || ''
      }
    };

    if (paymentType === 'bank_transfer') {
      chargePayload.bank_transfer = {
        bank: bank
      };
    }

    const midtransResponse = await fetch(midtransBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(chargePayload)
    });

    const midtransData = await midtransResponse.json();

    if (!midtransResponse.ok) {
      console.error('Midtrans Core API Error:', midtransData);
      return NextResponse.json({ error: 'Failed to create payment transaction with Midtrans' }, { status: 502 });
    }

    // 7. Parse response VA or QRIS
    let paymentDetail = '';
    let bankNameStr = '';

    if (paymentType === 'bank_transfer' && midtransData.va_numbers?.[0]) {
      paymentDetail = midtransData.va_numbers[0].va_number;
      bankNameStr = midtransData.va_numbers[0].bank;
    } else if (paymentType === 'qris' && midtransData.actions) {
      const qrAction = midtransData.actions.find((action: any) => action.name === 'generate-qr-code');
      if (qrAction) {
        paymentDetail = qrAction.url;
      }
    }

    // 8. Update transaction record in database with payment detail details
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        payment_detail: paymentDetail,
        bank_name: bankNameStr
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Failed to update payment details in database:', updateError);
    }

    return NextResponse.json({
      transactionId: transactionId,
      paymentDetail: paymentDetail,
      bankName: bankNameStr,
      paymentType: paymentType,
      isSimulation: false
    });

  } catch (err: any) {
    console.error('Checkout API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
