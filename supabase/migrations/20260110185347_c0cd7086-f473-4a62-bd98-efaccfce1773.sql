-- Add Brazilian document and phone fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN cpf TEXT,
ADD COLUMN cnpj TEXT,
ADD COLUMN phone TEXT;

-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_store_id UUID;
BEGIN
  -- Create a new store for the user
  INSERT INTO public.stores (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'store_name', 'Minha Loja'),
    COALESCE(NEW.raw_user_meta_data ->> 'store_slug', 'loja-' || LEFT(NEW.id::text, 8))
  )
  RETURNING id INTO new_store_id;

  -- Create profile with all required fields
  INSERT INTO public.profiles (id, store_id, full_name, cpf, cnpj, phone)
  VALUES (
    NEW.id,
    new_store_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cnpj', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );

  -- Assign default 'admin' role (first user of store is admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$$;