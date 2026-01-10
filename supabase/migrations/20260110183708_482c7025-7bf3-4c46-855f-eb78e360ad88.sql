
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'admin_global');

-- Create stores table (lojas)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  tryons_limit INTEGER NOT NULL DEFAULT 10,
  tryons_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to get user's store_id
CREATE OR REPLACE FUNCTION public.get_user_store_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user is admin_global
CREATE OR REPLACE FUNCTION public.is_admin_global(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin_global')
$$;

-- RLS Policies for stores
CREATE POLICY "Users can view their own store"
ON public.stores FOR SELECT
USING (
  public.is_admin_global(auth.uid()) 
  OR id = public.get_user_store_id(auth.uid())
);

CREATE POLICY "Admins can update their own store"
ON public.stores FOR UPDATE
USING (
  public.is_admin_global(auth.uid())
  OR (id = public.get_user_store_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admin global can insert stores"
ON public.stores FOR INSERT
WITH CHECK (public.is_admin_global(auth.uid()) OR true);

CREATE POLICY "Admin global can delete stores"
ON public.stores FOR DELETE
USING (public.is_admin_global(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles from same store"
ON public.profiles FOR SELECT
USING (
  public.is_admin_global(auth.uid())
  OR id = auth.uid()
  OR store_id = public.get_user_store_id(auth.uid())
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Profiles are created on signup"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (
  public.is_admin_global(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Admin global can manage roles"
ON public.user_roles FOR ALL
USING (public.is_admin_global(auth.uid()));

CREATE POLICY "Store admins can manage roles for their store users"
ON public.user_roles FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = auth.uid()
    AND p2.id = user_id
    AND p1.store_id = p2.store_id
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

  -- Create profile
  INSERT INTO public.profiles (id, store_id, full_name)
  VALUES (
    NEW.id,
    new_store_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );

  -- Assign default 'admin' role (first user of store is admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Update products table to link with stores
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Update products RLS to be store-scoped
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;

CREATE POLICY "Users can view products from their store"
ON public.products FOR SELECT
USING (
  public.is_admin_global(auth.uid())
  OR store_id = public.get_user_store_id(auth.uid())
);

CREATE POLICY "Users can insert products to their store"
ON public.products FOR INSERT
WITH CHECK (store_id = public.get_user_store_id(auth.uid()));

CREATE POLICY "Users can update products from their store"
ON public.products FOR UPDATE
USING (store_id = public.get_user_store_id(auth.uid()));

CREATE POLICY "Admins can delete products from their store"
ON public.products FOR DELETE
USING (
  public.is_admin_global(auth.uid())
  OR (store_id = public.get_user_store_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
);
