-- MIGRATION: RESTRICT REFERRAL COMMISSION TO SINGLE PREMIUM UPGRADE ONLY
-- Restricts commission to only the first PREMIUM upgrade.
-- Restricts commission from triggering on Tryout package/ticket payments (package_id IS NULL and title = 'Upgrade Keanggotaan PREMIUM').

CREATE OR REPLACE FUNCTION public.handle_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_is_referred BOOLEAN;
BEGIN
  -- Case 1: Triggered by public.profiles (subscription_status updated to PREMIUM)
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.subscription_status = 'PREMIUM' AND (OLD.subscription_status IS DISTINCT FROM 'PREMIUM') THEN
      -- Check if referee exists in referrals and HAS NOT received commission yet (commission_earned = 0)
      SELECT EXISTS(
        SELECT 1 FROM public.referrals 
        WHERE referee_id = NEW.id AND commission_earned = 0
      ) INTO v_is_referred;
      
      IF v_is_referred THEN
        -- Get referrer ID
        SELECT referrer_id INTO v_referrer_id 
        FROM public.referrals 
        WHERE referee_id = NEW.id;

        -- Update referrals commission to Rp 10.000 (locks it so it cannot be triggered again)
        UPDATE public.referrals
        SET commission_earned = 10000
        WHERE referee_id = NEW.id;

        -- Update referrer's affiliate balance
        INSERT INTO public.affiliates (user_id, referral_code, balance)
        VALUES (
          v_referrer_id,
          'REF' || UPPER(SUBSTRING(REPLACE(v_referrer_id::text, '-', ''), 1, 6)),
          10000
        )
        ON CONFLICT (user_id) DO UPDATE
        SET balance = public.affiliates.balance + 10000;
        
        RAISE NOTICE 'Referral commission of 10000 awarded to referrer % via Profile upgrade', v_referrer_id;
      END IF;
    END IF;
    
  -- Case 2: Triggered by public.transactions (status updated to SUCCESS)
  ELSIF TG_TABLE_NAME = 'transactions' THEN
    -- ONLY trigger if transaction status becomes SUCCESS, AND it is a premium upgrade (no package_id, and title is 'Upgrade Keanggotaan PREMIUM')
    IF NEW.status = 'SUCCESS' AND (OLD.status IS DISTINCT FROM 'SUCCESS') 
       AND NEW.package_id IS NULL 
       AND NEW.title = 'Upgrade Keanggotaan PREMIUM' THEN
      
      -- Check if referee exists in referrals and HAS NOT received commission yet (commission_earned = 0)
      SELECT EXISTS(
        SELECT 1 FROM public.referrals 
        WHERE referee_id = NEW.user_id AND commission_earned = 0
      ) INTO v_is_referred;
      
      IF v_is_referred THEN
        -- Get referrer ID
        SELECT referrer_id INTO v_referrer_id 
        FROM public.referrals 
        WHERE referee_id = NEW.user_id;

        -- Update referrals commission to Rp 10.000 (locks it so it cannot be triggered again)
        UPDATE public.referrals
        SET commission_earned = 10000
        WHERE referee_id = NEW.user_id;

        -- Update referrer's affiliate balance
        INSERT INTO public.affiliates (user_id, referral_code, balance)
        VALUES (
          v_referrer_id,
          'REF' || UPPER(SUBSTRING(REPLACE(v_referrer_id::text, '-', ''), 1, 6)),
          10000
        )
        ON CONFLICT (user_id) DO UPDATE
        SET balance = public.affiliates.balance + 10000;
        
        RAISE NOTICE 'Referral commission of 10000 awarded to referrer % via Transaction success', v_referrer_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger on public.profiles
DROP TRIGGER IF EXISTS on_profile_premium_upgrade ON public.profiles;
CREATE TRIGGER on_profile_premium_upgrade
  AFTER UPDATE OF subscription_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_commission();

-- Re-create Trigger on public.transactions
DROP TRIGGER IF EXISTS on_transaction_success_commission ON public.transactions;
CREATE TRIGGER on_transaction_success_commission
  AFTER UPDATE OF status ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_commission();
