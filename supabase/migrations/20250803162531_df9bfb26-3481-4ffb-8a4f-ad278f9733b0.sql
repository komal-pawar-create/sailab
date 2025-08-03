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

-- Insert sample labs
INSERT INTO public.labs (id, name, location) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Central Lab', 'Downtown Medical Center'),
  ('550e8400-e29b-41d4-a716-446655440002', 'North Branch Lab', 'North Side Hospital'),
  ('550e8400-e29b-41d4-a716-446655440003', 'West Coast Lab', 'West Medical Plaza');

-- Insert sample patients
INSERT INTO public.patients (id, lab_id, patient_id, full_name, age, gender, phone, email, created_by) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'PAT001', 'John Smith', 45, 'Male', '+1-555-0101', 'john.smith@email.com', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'PAT002', 'Sarah Johnson', 32, 'Female', '+1-555-0102', 'sarah.j@email.com', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'PAT003', 'Michael Brown', 28, 'Male', '+1-555-0103', 'mike.brown@email.com', '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'PAT004', 'Emily Davis', 41, 'Female', '+1-555-0104', 'emily.davis@email.com', '550e8400-e29b-41d4-a716-446655440003');

-- Insert sample test reports
INSERT INTO public.test_reports (patient_id, lab_id, test_type, test_date, results, status, created_by) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Blood Chemistry', '2024-08-01', '{"glucose": 95, "cholesterol": 180, "hemoglobin": 14.2}', 'completed', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Complete Blood Count', '2024-08-02', '{"wbc": 7200, "rbc": 4.8, "platelets": 250000}', 'completed', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Liver Function', '2024-08-03', '{"alt": 25, "ast": 30, "bilirubin": 1.1}', 'pending', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample documents
INSERT INTO public.documents (patient_id, lab_id, file_name, file_type, file_size, uploaded_by) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'blood_test_results.pdf', 'application/pdf', 2048576, '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'medical_history.pdf', 'application/pdf', 1536000, '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'x_ray_report.pdf', 'application/pdf', 3072000, '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample feedback
INSERT INTO public.feedback (lab_id, patient_id, feedback_type, message, rating, created_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'service', 'Excellent service and quick results!', 5, '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'facility', 'Clean and well-organized facility.', 4, '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'staff', 'Very professional and friendly staff.', 5, '550e8400-e29b-41d4-a716-446655440002');