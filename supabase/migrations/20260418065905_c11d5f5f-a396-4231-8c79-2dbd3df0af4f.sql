CREATE OR REPLACE FUNCTION public.generate_ean13(prefix TEXT DEFAULT '200')
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  sum_odd INTEGER := 0;
  sum_even INTEGER := 0;
  i INTEGER;
  digit INTEGER;
  check_digit INTEGER;
BEGIN
  base := prefix || lpad(floor(random() * 1000000000)::TEXT, 12 - length(prefix), '0');
  base := substring(base from 1 for 12);
  
  FOR i IN 1..12 LOOP
    digit := substring(base from i for 1)::INTEGER;
    IF i % 2 = 1 THEN
      sum_odd := sum_odd + digit;
    ELSE
      sum_even := sum_even + digit;
    END IF;
  END LOOP;
  
  check_digit := (10 - ((sum_odd + sum_even * 3) % 10)) % 10;
  RETURN base || check_digit::TEXT;
END;
$$;