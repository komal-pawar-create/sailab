-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'operator_1', 'operator_2', 'operator_3');

-- Create labs table
CREATE TABLE public.labs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator_1',
  lab_id UUID REFERENCES public.labs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.labs(id),
  patient_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  email TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lab_id, patient_id)
);

-- Create test_reports table
CREATE TABLE public.test_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  lab_id UUID NOT NULL REFERENCES public.labs(id),
  test_type TEXT NOT NULL,
  test_date DATE NOT NULL,
  results JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  lab_id UUID NOT NULL REFERENCES public.labs(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_path TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.labs(id),
  patient_id UUID REFERENCES public.patients(id),
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = has_role.user_id AND role = required_role
  )
$$;

-- Create function to get user lab
CREATE OR REPLACE FUNCTION public.get_user_lab(user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT lab_id FROM public.profiles WHERE profiles.user_id = get_user_lab.user_id
$$;

-- RLS Policies for labs
CREATE POLICY "Admins can view all labs" ON public.labs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can view their lab" ON public.labs
  FOR SELECT USING (id = public.get_user_lab(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Operators can view patients from their lab" ON public.patients
  FOR ALL USING (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Admins can view all patients" ON public.patients
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_reports
CREATE POLICY "Operators can view reports from their lab" ON public.test_reports
  FOR ALL USING (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Admins can view all reports" ON public.test_reports
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for documents
CREATE POLICY "Operators can view documents from their lab" ON public.documents
  FOR ALL USING (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Admins can view all documents" ON public.documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feedback
CREATE POLICY "Operators can view feedback from their lab" ON public.feedback
  FOR ALL USING (lab_id = public.get_user_lab(auth.uid()));

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_reports_updated_at BEFORE UPDATE ON public.test_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample labs (this is safe as it doesn't depend on auth.users)
INSERT INTO public.labs (id, name, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Central Lab', 'Downtown Medical Center'),
  ('550e8400-e29b-41d4-a716-446655440002', 'North Branch Lab', 'North Side Hospital'),
  ('550e8400-e29b-41d4-a716-446655440003', 'West Coast Lab', 'West Medical Plaza');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, lab_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator_1'),
    (NEW.raw_user_meta_data->>'lab_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();