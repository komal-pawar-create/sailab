-- Online pathology reporting library and branch overrides.
-- Additive migration: keeps existing report/test-type workflows intact.

ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'pathology';
ALTER TABLE public.global_test_types ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS library_group TEXT DEFAULT 'General';
ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS default_price NUMERIC DEFAULT 0;
ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.global_test_types ADD COLUMN IF NOT EXISTS is_default_library BOOLEAN DEFAULT false;

ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS report_number TEXT;
ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE public.test_reports ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS public.global_test_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  global_test_type_id UUID NOT NULL REFERENCES public.global_test_types(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  unit TEXT,
  ref_range_min TEXT,
  ref_range_max TEXT,
  ref_range_text TEXT,
  default_value TEXT,
  formula_key TEXT,
  sort_order INTEGER DEFAULT 0,
  is_section_header BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(global_test_type_id, parameter_name)
);

CREATE TABLE IF NOT EXISTS public.branch_test_library_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  global_test_type_id UUID NOT NULL REFERENCES public.global_test_types(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC DEFAULT 0,
  display_name TEXT,
  is_user_modified BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, global_test_type_id)
);

CREATE TABLE IF NOT EXISTS public.branch_test_parameter_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  global_parameter_id UUID NOT NULL REFERENCES public.global_test_parameters(id) ON DELETE CASCADE,
  parameter_name TEXT,
  unit TEXT,
  ref_range_min TEXT,
  ref_range_max TEXT,
  ref_range_text TEXT,
  default_value TEXT,
  is_user_modified BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, global_parameter_id)
);

ALTER TABLE public.global_test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_test_library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_test_parameter_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone authenticated can view global pathology parameters" ON public.global_test_parameters;
CREATE POLICY "Everyone authenticated can view global pathology parameters"
ON public.global_test_parameters FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage global pathology parameters" ON public.global_test_parameters;
CREATE POLICY "Admins can manage global pathology parameters"
ON public.global_test_parameters FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.user_role) OR public.is_lab_admin(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.user_role) OR public.is_lab_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view their branch pathology library settings" ON public.branch_test_library_settings;
CREATE POLICY "Users can view their branch pathology library settings"
ON public.branch_test_library_settings FOR SELECT
USING (
  branch_id = public.get_user_branch(auth.uid())
  OR lab_id = public.get_user_lab(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

DROP POLICY IF EXISTS "Lab admins can manage branch pathology library settings" ON public.branch_test_library_settings;
CREATE POLICY "Lab admins can manage branch pathology library settings"
ON public.branch_test_library_settings FOR ALL
USING (
  branch_id = public.get_user_branch(auth.uid())
  OR (public.is_lab_admin(auth.uid()) AND lab_id = public.get_user_lab(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
)
WITH CHECK (
  branch_id = public.get_user_branch(auth.uid())
  OR (public.is_lab_admin(auth.uid()) AND lab_id = public.get_user_lab(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

DROP POLICY IF EXISTS "Users can view their branch pathology parameter overrides" ON public.branch_test_parameter_overrides;
CREATE POLICY "Users can view their branch pathology parameter overrides"
ON public.branch_test_parameter_overrides FOR SELECT
USING (
  branch_id = public.get_user_branch(auth.uid())
  OR lab_id = public.get_user_lab(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

DROP POLICY IF EXISTS "Lab admins can manage branch pathology parameter overrides" ON public.branch_test_parameter_overrides;
CREATE POLICY "Lab admins can manage branch pathology parameter overrides"
ON public.branch_test_parameter_overrides FOR ALL
USING (
  branch_id = public.get_user_branch(auth.uid())
  OR (public.is_lab_admin(auth.uid()) AND lab_id = public.get_user_lab(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
)
WITH CHECK (
  branch_id = public.get_user_branch(auth.uid())
  OR (public.is_lab_admin(auth.uid()) AND lab_id = public.get_user_lab(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::public.user_role)
);

CREATE INDEX IF NOT EXISTS idx_global_test_types_short_name ON public.global_test_types(department, short_name);
CREATE INDEX IF NOT EXISTS idx_global_test_parameters_type ON public.global_test_parameters(global_test_type_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_branch_test_library_branch ON public.branch_test_library_settings(branch_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_test_reports_pdf_url ON public.test_reports(pdf_url) WHERE pdf_url IS NOT NULL;

DROP TRIGGER IF EXISTS update_global_test_parameters_updated_at ON public.global_test_parameters;
CREATE TRIGGER update_global_test_parameters_updated_at
BEFORE UPDATE ON public.global_test_parameters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branch_test_library_settings_updated_at ON public.branch_test_library_settings;
CREATE TRIGGER update_branch_test_library_settings_updated_at
BEFORE UPDATE ON public.branch_test_library_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branch_test_parameter_overrides_updated_at ON public.branch_test_parameter_overrides;
CREATE TRIGGER update_branch_test_parameter_overrides_updated_at
BEFORE UPDATE ON public.branch_test_parameter_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('pathology-reports', 'pathology-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Upgrade matching legacy global tests in place so the default library does not create duplicates.
WITH core(short_name, test_name) AS (
  VALUES
    ('CBC','Complete Blood Count'),
    ('KFT','Renal Function Test'),
    ('LFT','Liver Function Test'),
    ('LIPID','Lipid Profile'),
    ('WIDAL','Widal Test'),
    ('URINE','Urine Routine'),
    ('SUGAR','Blood Sugar'),
    ('THYROID','Thyroid Profile'),
    ('SEROLOGY','Serology'),
    ('DENGUE_RAPID','Dengue NS1 IgG IgM - Rapid'),
    ('BIO','Individual Biochemistry'),
    ('RA_PANEL','Rheumatoid Panel'),
    ('MP_RAPID','Malaria Antigen (MP) - Rapid')
)
UPDATE public.global_test_types g
SET short_name = c.short_name,
    department = 'pathology'
FROM core c
WHERE lower(trim(g.test_name)) = lower(trim(c.test_name))
  AND (g.short_name IS NULL OR trim(g.short_name) = '');
WITH seed(short_name, test_name, library_group, default_price, enabled_by_default, sort_order, description) AS (
  VALUES
  ('CBC','Complete Blood Count','Routine Blood Tests',350,true,10,'CBC with differential and RBC indices'),
  ('KFT','Renal Function Test','Kidney Function',450,true,20,'Renal function profile'),
  ('LFT','Liver Function Test','Liver Function',500,true,30,'Liver function profile'),
  ('LIPID','Lipid Profile','Lipid Profile',500,true,40,'Lipid profile with calculated LDL/VLDL'),
  ('WIDAL','Widal Test','Infection & Fever Profile',200,true,50,'Widal slide agglutination panel'),
  ('URINE','Urine Routine','Urine Tests',150,true,60,'Urine physical, chemical and microscopy'),
  ('SUGAR','Blood Sugar','Diabetes Tests',100,true,70,'Blood sugar and HbA1c panel'),
  ('THYROID','Thyroid Profile','Thyroid',500,true,80,'T3, T4 and TSH'),
  ('SEROLOGY','Serology','Serology',300,true,90,'Common serology screening'),
  ('DENGUE_RAPID','Dengue NS1 IgG IgM - Rapid','Infection & Fever Profile',600,true,100,'Dengue rapid screening panel'),
  ('BIO','Individual Biochemistry','Vitamins & Minerals',150,true,110,'Common individual biochemistry tests'),
  ('RA_PANEL','Rheumatoid Panel','Rheumatology',600,true,120,'Rheumatology screening profile'),
  ('MP_RAPID','Malaria Antigen (MP) - Rapid','Infection & Fever Profile',300,true,130,'P. vivax and P. falciparum rapid antigen'),
  ('ESR','ESR (Erythrocyte Sedimentation Rate)','Routine Blood Tests',100,false,200,'Standalone ESR'),
  ('PSMEAR','Peripheral Smear','Routine Blood Tests',250,false,210,'Peripheral smear morphology'),
  ('HB','Hemoglobin (Hb)','Routine Blood Tests',80,false,220,'Standalone hemoglobin'),
  ('BLOOD_GROUP','Blood Group and Rh Typing','Routine Blood Tests',150,false,230,'ABO and Rh typing'),
  ('RETIC','Reticulocyte Count','Routine Blood Tests',250,false,240,'Reticulocyte count'),
  ('HBA1C','HbA1c','Diabetes Tests',400,false,300,'HbA1c with estimated average glucose'),
  ('GTT','Glucose Tolerance Test (GTT)','Diabetes Tests',500,false,310,'Glucose tolerance profile'),
  ('INSULIN','Insulin','Diabetes Tests',600,false,320,'Fasting insulin'),
  ('CPEPTIDE','C-Peptide','Diabetes Tests',700,false,330,'C-peptide'),
  ('UREA','Urea','Kidney Function',100,false,400,'Standalone urea'),
  ('CREAT','Creatinine','Kidney Function',100,false,410,'Standalone creatinine'),
  ('URIC_ACID','Uric Acid','Kidney Function',150,false,420,'Standalone uric acid'),
  ('ELECTRO','Electrolytes (Na, K, Cl)','Kidney Function',350,false,430,'Electrolytes'),
  ('BILIRUBIN','Bilirubin','Liver Function',150,false,500,'Bilirubin fractions'),
  ('SGOT','SGOT (AST)','Liver Function',150,false,510,'AST'),
  ('SGPT','SGPT (ALT)','Liver Function',150,false,520,'ALT'),
  ('ALP','ALP','Liver Function',150,false,530,'Alkaline phosphatase'),
  ('GGT','GGT','Liver Function',250,false,540,'Gamma GT'),
  ('ALBUMIN','Albumin','Liver Function',150,false,550,'Serum albumin'),
  ('CHOL','Total Cholesterol','Lipid Profile',150,false,600,'Standalone total cholesterol'),
  ('TRIGLY','Triglycerides','Lipid Profile',150,false,610,'Standalone triglycerides'),
  ('HDL','HDL Cholesterol','Lipid Profile',150,false,620,'Standalone HDL'),
  ('LDL','LDL Cholesterol','Lipid Profile',150,false,630,'Standalone LDL'),
  ('VLDL','VLDL Cholesterol','Lipid Profile',150,false,640,'Standalone VLDL'),
  ('T3_SINGLE','T3','Thyroid',200,false,700,'Standalone T3'),
  ('T4_SINGLE','T4','Thyroid',200,false,710,'Standalone T4'),
  ('TSH_SINGLE','TSH','Thyroid',250,false,720,'Standalone TSH'),
  ('FT3','Free T3','Thyroid',300,false,730,'Free T3'),
  ('FT4','Free T4','Thyroid',300,false,740,'Free T4'),
  ('ANTI_TPO','Anti-TPO','Thyroid',600,false,750,'Anti-TPO antibody'),
  ('TROP_I','Troponin-I','Cardiac Tests',900,false,800,'Troponin-I'),
  ('CK_MB','CK-MB','Cardiac Tests',500,false,810,'CK-MB'),
  ('LDH','LDH','Cardiac Tests',400,false,820,'LDH'),
  ('NT_PROBNP','NT-proBNP','Cardiac Tests',1500,false,830,'NT-proBNP'),
  ('DDIMER','D-Dimer','Cardiac Tests',900,false,840,'D-Dimer'),
  ('MP_MICRO','MP (Malarial Parasite)','Infection & Fever Profile',150,false,900,'Peripheral smear for malaria parasite'),
  ('TYPHIDOT','Typhidot','Infection & Fever Profile',500,false,910,'Typhidot IgM/IgG'),
  ('CHIKUNGUNYA','Chikungunya','Infection & Fever Profile',600,false,920,'Chikungunya rapid/ELISA'),
  ('LEPTOSPIRA','Leptospira','Infection & Fever Profile',700,false,930,'Leptospira IgM'),
  ('SCRUB_TYPHUS','Scrub Typhus','Infection & Fever Profile',800,false,940,'Scrub typhus IgM'),
  ('COVID','COVID-19 Antigen / PCR','Infection & Fever Profile',800,false,950,'COVID antigen/PCR'),
  ('INFLUENZA_AB','Influenza A/B','Infection & Fever Profile',700,false,960,'Influenza A/B rapid antigen'),
  ('RA_FACTOR','RA Factor','Rheumatology',250,false,1000,'RA factor'),
  ('CRP','CRP','Rheumatology',300,false,1010,'C-reactive protein'),
  ('ASO','ASO Titre','Rheumatology',350,false,1020,'ASO titre'),
  ('ANA','ANA','Rheumatology',700,false,1030,'ANA'),
  ('ANTI_CCP','Anti-CCP','Rheumatology',900,false,1040,'Anti-CCP'),
  ('HLA_B27','HLA-B27','Rheumatology',1500,false,1050,'HLA-B27'),
  ('HIV','HIV I & II','Serology',400,false,1100,'HIV I and II'),
  ('HBSAG','HBsAg','Serology',350,false,1110,'HBsAg'),
  ('HCV','HCV','Serology',500,false,1120,'Anti-HCV'),
  ('VDRL_SINGLE','VDRL','Serology',250,false,1130,'VDRL'),
  ('TPHA','TPHA','Serology',500,false,1140,'TPHA'),
  ('VIT_D','Vitamin D','Hormones',700,false,1200,'25-OH Vitamin D'),
  ('VIT_B12','Vitamin B12','Hormones',700,false,1210,'Vitamin B12'),
  ('FERRITIN','Ferritin','Hormones',700,false,1220,'Ferritin'),
  ('FSH','FSH','Hormones',600,false,1230,'FSH'),
  ('LH','LH','Hormones',600,false,1240,'LH'),
  ('PROLACTIN','Prolactin','Hormones',600,false,1250,'Prolactin'),
  ('TESTOSTERONE','Testosterone','Hormones',700,false,1260,'Testosterone'),
  ('ESTROGEN','Estrogen','Hormones',700,false,1270,'Estrogen'),
  ('PROGESTERONE','Progesterone','Hormones',700,false,1280,'Progesterone'),
  ('CORTISOL','Cortisol','Hormones',700,false,1290,'Cortisol'),
  ('AMH','AMH','Hormones',1200,false,1300,'AMH'),
  ('URINE_MICRO','Urine Microscopy','Urine Tests',150,false,1400,'Urine microscopy'),
  ('URINE_CULTURE','Urine Culture','Urine Tests',800,false,1410,'Urine culture and sensitivity'),
  ('MICROALBUMIN','Microalbumin','Urine Tests',500,false,1420,'Urine microalbumin'),
  ('PREG_TEST','Pregnancy Test','Urine Tests',150,false,1430,'Urine hCG'),
  ('STOOL_ROUTINE','Stool Routine','Stool Tests',250,false,1500,'Stool routine'),
  ('STOOL_OB','Stool Occult Blood','Stool Tests',300,false,1510,'Stool occult blood'),
  ('STOOL_CULTURE','Stool Culture','Stool Tests',900,false,1520,'Stool culture'),
  ('OVA_PARASITE','Ova and Parasite','Stool Tests',300,false,1530,'Ova and parasite'),
  ('PT_INR','PT/INR','Coagulation Tests',500,false,1600,'PT/INR'),
  ('APTT','APTT','Coagulation Tests',500,false,1610,'APTT'),
  ('BT','Bleeding Time','Coagulation Tests',200,false,1620,'Bleeding time'),
  ('CT','Clotting Time','Coagulation Tests',200,false,1630,'Clotting time'),
  ('FIBRINOGEN','Fibrinogen','Coagulation Tests',800,false,1640,'Fibrinogen'),
  ('PSA','PSA','Cancer Markers',800,false,1700,'PSA'),
  ('CEA','CEA','Cancer Markers',900,false,1710,'CEA'),
  ('CA125','CA-125','Cancer Markers',1000,false,1720,'CA-125'),
  ('CA199','CA 19-9','Cancer Markers',1000,false,1730,'CA 19-9'),
  ('AFP','AFP','Cancer Markers',900,false,1740,'AFP'),
  ('BETA_HCG','Beta-hCG','Cancer Markers',800,false,1750,'Beta-hCG'),
  ('TOTAL_IGE','Total IgE','Allergy Tests',800,false,1800,'Total IgE'),
  ('SPECIFIC_IGE','Specific IgE','Allergy Tests',1200,false,1810,'Specific IgE'),
  ('EOS_COUNT','Eosinophil Count','Allergy Tests',150,false,1820,'Absolute eosinophil count'),
  ('CALCIUM','Calcium','Vitamins & Minerals',150,false,1900,'Calcium'),
  ('PHOSPHORUS','Phosphorus','Vitamins & Minerals',150,false,1910,'Phosphorus'),
  ('MAGNESIUM','Magnesium','Vitamins & Minerals',400,false,1920,'Magnesium'),
  ('IRON_STUDIES','Iron Studies (Iron, TIBC, Ferritin)','Vitamins & Minerals',900,false,1930,'Iron studies'),
  ('ZINC','Zinc','Vitamins & Minerals',700,false,1940,'Zinc'),
  ('COPPER','Copper','Vitamins & Minerals',700,false,1950,'Copper'),
  ('HB_ELECTRO','Hb Electrophoresis','Special Tests',1500,false,2000,'Hb electrophoresis'),
  ('G6PD','G6PD','Special Tests',900,false,2010,'G6PD'),
  ('SICKLE_CELL','Sickle Cell Test','Special Tests',300,false,2020,'Sickle cell screening'),
  ('HPLC','HPLC','Special Tests',1800,false,2030,'HPLC'),
  ('SEMEN','Semen Analysis','Special Tests',700,false,2040,'Semen analysis'),
  ('SPUTUM','Sputum Examination','Special Tests',300,false,2050,'Sputum examination')
)
INSERT INTO public.global_test_types (short_name, test_name, description, category, department, library_group, default_price, sort_order, is_default_library, is_active)
SELECT short_name, test_name, description, library_group, 'pathology', library_group, default_price, sort_order, true, true
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM public.global_test_types g
  WHERE g.department = 'pathology' AND lower(coalesce(g.short_name, '')) = lower(s.short_name)
);

WITH seed(short_name, test_name, library_group, default_price, enabled_by_default, sort_order, description) AS (
  VALUES
  ('CBC','Complete Blood Count','Routine Blood Tests',350,true,10,'CBC with differential and RBC indices'),
  ('KFT','Renal Function Test','Kidney Function',450,true,20,'Renal function profile'),
  ('LFT','Liver Function Test','Liver Function',500,true,30,'Liver function profile'),
  ('LIPID','Lipid Profile','Lipid Profile',500,true,40,'Lipid profile with calculated LDL/VLDL'),
  ('WIDAL','Widal Test','Infection & Fever Profile',200,true,50,'Widal slide agglutination panel'),
  ('URINE','Urine Routine','Urine Tests',150,true,60,'Urine physical, chemical and microscopy'),
  ('SUGAR','Blood Sugar','Diabetes Tests',100,true,70,'Blood sugar and HbA1c panel'),
  ('THYROID','Thyroid Profile','Thyroid',500,true,80,'T3, T4 and TSH'),
  ('SEROLOGY','Serology','Serology',300,true,90,'Common serology screening'),
  ('DENGUE_RAPID','Dengue NS1 IgG IgM - Rapid','Infection & Fever Profile',600,true,100,'Dengue rapid screening panel'),
  ('BIO','Individual Biochemistry','Vitamins & Minerals',150,true,110,'Common individual biochemistry tests'),
  ('RA_PANEL','Rheumatoid Panel','Rheumatology',600,true,120,'Rheumatology screening profile'),
  ('MP_RAPID','Malaria Antigen (MP) - Rapid','Infection & Fever Profile',300,true,130,'P. vivax and P. falciparum rapid antigen')
)
UPDATE public.global_test_types g
SET test_name = s.test_name,
    description = s.description,
    category = s.library_group,
    library_group = s.library_group,
    default_price = s.default_price,
    sort_order = s.sort_order,
    is_default_library = true,
    is_active = true
FROM seed s
WHERE g.department = 'pathology' AND lower(coalesce(g.short_name, '')) = lower(s.short_name);

WITH params(short_name, parameter_name, unit, ref_min, ref_max, ref_text, default_value, formula_key, sort_order, is_section_header) AS (
  VALUES
  ('CBC','Haemoglobin (Hb)','g/dL','12.0','17.0','Adult: 12.0 - 17.0',NULL,NULL,1,false),
  ('CBC','Total WBC Count','/cumm','4000','11000',NULL,NULL,NULL,2,false),
  ('CBC','Neutrophils','%','40','75',NULL,NULL,NULL,3,false),
  ('CBC','Lymphocytes','%','20','45',NULL,NULL,NULL,4,false),
  ('CBC','Eosinophils','%','1','6',NULL,NULL,NULL,5,false),
  ('CBC','Monocytes','%','2','10',NULL,NULL,NULL,6,false),
  ('CBC','Basophils','%','0','1',NULL,NULL,NULL,7,false),
  ('CBC','RBC Count','million/cumm','4.0','5.5','Adult: 4.0 - 5.5',NULL,NULL,8,false),
  ('CBC','Platelet Count','lakh/cumm','1.5','4.5',NULL,NULL,NULL,9,false),
  ('CBC','PCV / HCT','%','36','50','Adult: 36 - 50',NULL,NULL,10,false),
  ('CBC','MCV','fL','80','100',NULL,NULL,NULL,11,false),
  ('CBC','MCH','pg','27','32',NULL,NULL,NULL,12,false),
  ('CBC','MCHC','g/dL','32','36',NULL,NULL,NULL,13,false),
  ('CBC','RDW','%','11.5','14.5',NULL,NULL,NULL,14,false),
  ('CBC','ESR','mm/hr','0','20','Adult default',NULL,NULL,15,false),
  ('KFT','S. Creatinine','mg/dL','0.6','1.3','Adult default',NULL,NULL,1,false),
  ('KFT','S. Urea','mg/dL','15','45',NULL,NULL,NULL,2,false),
  ('KFT','Blood Urea Nitrogen (BUN)','mg/dL','7','20',NULL,NULL,'kft.bun',3,false),
  ('KFT','S. Uric Acid','mg/dL','3.5','7.2','Adult default',NULL,NULL,4,false),
  ('KFT','S. Calcium','mg/dL','8.5','10.5',NULL,NULL,NULL,5,false),
  ('KFT','S. Sodium','mEq/L','135','145',NULL,NULL,NULL,6,false),
  ('KFT','S. Potassium','mEq/L','3.5','5.1',NULL,NULL,NULL,7,false),
  ('KFT','S. Chloride','mEq/L','98','107',NULL,NULL,NULL,8,false),
  ('LFT','Bilirubin (Total)','mg/dL','0.2','1.2',NULL,NULL,NULL,1,false),
  ('LFT','Bilirubin (Direct)','mg/dL','0.0','0.3',NULL,NULL,NULL,2,false),
  ('LFT','Bilirubin (Indirect)','mg/dL','0.2','0.9',NULL,NULL,'lft.indirect_bilirubin',3,false),
  ('LFT','S.G.O.T.','U/L','0','40','AST',NULL,NULL,4,false),
  ('LFT','S.G.P.T.','U/L','0','41','ALT',NULL,NULL,5,false),
  ('LFT','Alkaline Phosphatase','U/L','44','147','Adult default',NULL,NULL,6,false),
  ('LFT','Total Protein','g/dL','6.0','8.3',NULL,NULL,NULL,7,false),
  ('LFT','Albumin','g/dL','3.5','5.2',NULL,NULL,NULL,8,false),
  ('LFT','Globulin','g/dL','2.0','3.5',NULL,NULL,'lft.globulin',9,false),
  ('LFT','A/G Ratio','','1.0','2.2',NULL,NULL,'lft.ag_ratio',10,false),
  ('LFT','GGT','U/L','0','60','Adult default',NULL,NULL,11,false),
  ('LIPID','Total Cholesterol','mg/dL','0','200','Desirable: <200',NULL,NULL,1,false),
  ('LIPID','Triglycerides','mg/dL','0','150','Normal: <150',NULL,NULL,2,false),
  ('LIPID','HDL Cholesterol','mg/dL','40',NULL,'Desirable: >40',NULL,NULL,3,false),
  ('LIPID','LDL Cholesterol','mg/dL','0','100','Optimal: <100',NULL,'lipid.ldl',4,false),
  ('LIPID','VLDL Cholesterol','mg/dL','5','40',NULL,NULL,'lipid.vldl',5,false),
  ('LIPID','Total/HDL Ratio','','0','5.0','Desirable: <5.0',NULL,'lipid.total_hdl_ratio',6,false),
  ('WIDAL','S. Typhi O','Titre',NULL,NULL,'Negative / 1:20 / 1:40 / 1:80 / 1:160 / 1:320','Negative',NULL,1,false),
  ('WIDAL','S. Typhi H','Titre',NULL,NULL,'Negative / 1:20 / 1:40 / 1:80 / 1:160 / 1:320','Negative',NULL,2,false),
  ('WIDAL','S. Paratyphi AH','Titre',NULL,NULL,'Negative / 1:20 / 1:40 / 1:80 / 1:160 / 1:320','Negative',NULL,3,false),
  ('WIDAL','S. Paratyphi BH','Titre',NULL,NULL,'Negative / 1:20 / 1:40 / 1:80 / 1:160 / 1:320','Negative',NULL,4,false),
  ('WIDAL','Method','',NULL,NULL,'Slide agglutination','Slide agglutination',NULL,5,false),
  ('WIDAL','Interpretation','',NULL,NULL,'Negative or low titres are usually non-significant. Titres of 1:160 or above, or rising titres in paired sera, may be clinically significant. Correlate clinically.','Negative or low titres are usually non-significant. Titres of 1:160 or above, or rising titres in paired sera, may be clinically significant. Correlate clinically.',NULL,6,false),
  ('URINE','--- PHYSICAL EXAMINATION ---','',NULL,NULL,NULL,NULL,NULL,1,true),
  ('URINE','Volume','mL',NULL,NULL,NULL,NULL,NULL,2,false),
  ('URINE','Colour','',NULL,NULL,'Pale Straw','Pale Straw',NULL,3,false),
  ('URINE','Appearance','',NULL,NULL,'Clear','Clear',NULL,4,false),
  ('URINE','--- CHEMICAL EXAMINATION ---','',NULL,NULL,NULL,NULL,NULL,5,true),
  ('URINE','pH','','4.8','7.6',NULL,NULL,NULL,6,false),
  ('URINE','Protein','',NULL,NULL,'Nil','Nil',NULL,7,false),
  ('URINE','Sugar','',NULL,NULL,'Nil','Nil',NULL,8,false),
  ('URINE','Specific Gravity','','1.005','1.030',NULL,NULL,NULL,9,false),
  ('URINE','--- MICROSCOPIC EXAMINATION ---','',NULL,NULL,NULL,NULL,NULL,10,true),
  ('URINE','Red Blood Cells','/HPF',NULL,NULL,'Nil','Nil',NULL,11,false),
  ('URINE','Pus Cells','/HPF','0','2',NULL,NULL,NULL,12,false),
  ('URINE','Epithelial Cells','/HPF','0','2',NULL,NULL,NULL,13,false),
  ('URINE','Casts','',NULL,NULL,'Nil','Nil',NULL,14,false),
  ('URINE','Crystals','',NULL,NULL,'Nil','Nil',NULL,15,false),
  ('URINE','Bacteria','',NULL,NULL,'Nil','Nil',NULL,16,false),
  ('SUGAR','Random Blood Sugar (RBS)','mg/dL','70','140',NULL,NULL,NULL,1,false),
  ('SUGAR','Fasting Blood Sugar (FBS)','mg/dL','70','100','Impaired fasting: 100 - 125',NULL,NULL,2,false),
  ('SUGAR','Post Prandial Blood Sugar (PPBS)','mg/dL','70','140',NULL,NULL,NULL,3,false),
  ('SUGAR','HbA1c','%','4.0','5.6','Non-diabetic adult default',NULL,NULL,4,false),
  ('SUGAR','Estimated Average Glucose','mg/dL',NULL,NULL,'Calculated from HbA1c where applicable',NULL,'diabetes.eag',5,false),
  ('THYROID','T3 (Triiodothyronine)','ng/dL','60','181',NULL,NULL,NULL,1,false),
  ('THYROID','T4 (Thyroxine)','ug/dL','4.5','12.5',NULL,NULL,NULL,2,false),
  ('THYROID','TSH','uIU/mL','0.35','5.50',NULL,NULL,NULL,3,false),
  ('SEROLOGY','RA Factor','',NULL,NULL,'Negative / Positive','Negative',NULL,1,false),
  ('SEROLOGY','CRP (C-Reactive Protein)','mg/L','0','6',NULL,NULL,NULL,2,false),
  ('SEROLOGY','ASO Titre','IU/mL','0','200',NULL,NULL,NULL,3,false),
  ('SEROLOGY','HBsAg','',NULL,NULL,'Non-Reactive / Reactive','Non-Reactive',NULL,4,false),
  ('SEROLOGY','HIV I & II','',NULL,NULL,'Non-Reactive / Reactive','Non-Reactive',NULL,5,false),
  ('SEROLOGY','VDRL','',NULL,NULL,'Non-Reactive / Reactive','Non-Reactive',NULL,6,false),
  ('DENGUE_RAPID','Dengue NS1 Antigen','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('DENGUE_RAPID','Dengue IgG Antibody','',NULL,NULL,'Negative','Negative',NULL,2,false),
  ('DENGUE_RAPID','Dengue IgM Antibody','',NULL,NULL,'Negative','Negative',NULL,3,false),
  ('DENGUE_RAPID','Method','',NULL,NULL,'Immunochromatography','Immunochromatography',NULL,4,false),
  ('DENGUE_RAPID','Interpretation','',NULL,NULL,'This report is based on a rapid screening test and is provisional. Diagnosis should be confirmed by clinical correlation and confirmatory testing where required.','This report is based on a rapid screening test and is provisional. Diagnosis should be confirmed by clinical correlation and confirmatory testing where required.',NULL,5,false),
  ('BIO','S. Uric Acid','mg/dL','3.5','7.2','Adult default',NULL,NULL,1,false),
  ('BIO','ESR (Erythrocyte Sedimentation Rate)','mm/hr','0','20','Adult default',NULL,NULL,2,false),
  ('BIO','CRP (C-Reactive Protein)','mg/L','0','6',NULL,NULL,NULL,3,false),
  ('BIO','RA Factor (Quantitative)','IU/mL','0','14',NULL,NULL,NULL,4,false),
  ('BIO','S. Calcium','mg/dL','8.5','10.5',NULL,NULL,NULL,5,false),
  ('BIO','S. Phosphorus','mg/dL','2.5','4.5',NULL,NULL,NULL,6,false),
  ('BIO','Vitamin D','ng/mL','30','100',NULL,NULL,NULL,7,false),
  ('BIO','Vitamin B12','pg/mL','200','900',NULL,NULL,NULL,8,false),
  ('RA_PANEL','RA Factor (Qualitative)','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('RA_PANEL','RA Factor (Quantitative)','IU/mL','0','14',NULL,NULL,NULL,2,false),
  ('RA_PANEL','S. Uric Acid','mg/dL','3.5','7.2','Adult default',NULL,NULL,3,false),
  ('RA_PANEL','ESR (Westergren Method)','mm/hr','0','20','Adult default',NULL,NULL,4,false),
  ('RA_PANEL','CRP (C-Reactive Protein)','mg/L','0','6',NULL,NULL,NULL,5,false),
  ('MP_RAPID','Malaria Vivax Antigen','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('MP_RAPID','Malaria Falciparum Antigen','',NULL,NULL,'Negative','Negative',NULL,2,false),
  ('MP_RAPID','Method','',NULL,NULL,'Immunochromatography','Immunochromatography',NULL,3,false),
  ('MP_RAPID','Comments','',NULL,NULL,'Malaria rapid antigen test is an initial screening test for P. vivax and P. falciparum antigens in whole blood. Correlate clinically and confirm reactive or doubtful cases by peripheral blood smear where required.','Malaria rapid antigen test is an initial screening test for P. vivax and P. falciparum antigens in whole blood. Correlate clinically and confirm reactive or doubtful cases by peripheral blood smear where required.',NULL,4,false),
  ('ESR','ESR','mm/hr','0','20','Adult default; method dependent',NULL,NULL,1,false),
  ('PSMEAR','RBC Morphology','',NULL,NULL,'Normocytic normochromic','Normocytic normochromic',NULL,1,false),
  ('PSMEAR','WBC Morphology','',NULL,NULL,'No abnormal cells seen','No abnormal cells seen',NULL,2,false),
  ('PSMEAR','Platelets','',NULL,NULL,'Adequate','Adequate',NULL,3,false),
  ('HB','Haemoglobin (Hb)','g/dL','12.0','17.0','Adult default',NULL,NULL,1,false),
  ('BLOOD_GROUP','ABO Group','',NULL,NULL,'A / B / AB / O',NULL,NULL,1,false),
  ('BLOOD_GROUP','Rh Type','',NULL,NULL,'Positive / Negative',NULL,NULL,2,false),
  ('RETIC','Reticulocyte Count','%','0.5','2.5','Adult default',NULL,NULL,1,false),
  ('HBA1C','HbA1c','%','4.0','5.6','Non-diabetic adult default',NULL,NULL,1,false),
  ('HBA1C','Estimated Average Glucose','mg/dL',NULL,NULL,'Calculated where applicable',NULL,'diabetes.eag',2,false),
  ('GTT','Fasting Glucose','mg/dL','70','100',NULL,NULL,NULL,1,false),
  ('GTT','1 Hour Glucose','mg/dL',NULL,NULL,'Interpret as per protocol',NULL,NULL,2,false),
  ('GTT','2 Hour Glucose','mg/dL','0','140','Normal: <140',NULL,NULL,3,false),
  ('INSULIN','Fasting Insulin','uIU/mL','2.6','24.9','Method dependent',NULL,NULL,1,false),
  ('CPEPTIDE','C-Peptide','ng/mL','0.8','3.1','Fasting adult default; method dependent',NULL,NULL,1,false),
  ('UREA','S. Urea','mg/dL','15','45',NULL,NULL,NULL,1,false),
  ('CREAT','S. Creatinine','mg/dL','0.6','1.3','Adult default',NULL,NULL,1,false),
  ('URIC_ACID','S. Uric Acid','mg/dL','3.5','7.2','Adult default',NULL,NULL,1,false),
  ('ELECTRO','S. Sodium','mEq/L','135','145',NULL,NULL,NULL,1,false),
  ('ELECTRO','S. Potassium','mEq/L','3.5','5.1',NULL,NULL,NULL,2,false),
  ('ELECTRO','S. Chloride','mEq/L','98','107',NULL,NULL,NULL,3,false),
  ('BILIRUBIN','Bilirubin (Total)','mg/dL','0.2','1.2',NULL,NULL,NULL,1,false),
  ('BILIRUBIN','Bilirubin (Direct)','mg/dL','0.0','0.3',NULL,NULL,NULL,2,false),
  ('BILIRUBIN','Bilirubin (Indirect)','mg/dL','0.2','0.9',NULL,NULL,'lft.indirect_bilirubin',3,false),
  ('SGOT','S.G.O.T. (AST)','U/L','0','40',NULL,NULL,NULL,1,false),
  ('SGPT','S.G.P.T. (ALT)','U/L','0','41',NULL,NULL,NULL,1,false),
  ('ALP','Alkaline Phosphatase','U/L','44','147','Adult default',NULL,NULL,1,false),
  ('GGT','GGT','U/L','0','60','Adult default',NULL,NULL,1,false),
  ('ALBUMIN','Albumin','g/dL','3.5','5.2',NULL,NULL,NULL,1,false),
  ('CHOL','Total Cholesterol','mg/dL','0','200','Desirable: <200',NULL,NULL,1,false),
  ('TRIGLY','Triglycerides','mg/dL','0','150','Normal: <150',NULL,NULL,1,false),
  ('HDL','HDL Cholesterol','mg/dL','40',NULL,'Desirable: >40',NULL,NULL,1,false),
  ('LDL','LDL Cholesterol','mg/dL','0','100','Optimal: <100',NULL,NULL,1,false),
  ('VLDL','VLDL Cholesterol','mg/dL','5','40',NULL,NULL,NULL,1,false),
  ('T3_SINGLE','T3 (Triiodothyronine)','ng/dL','60','181',NULL,NULL,NULL,1,false),
  ('T4_SINGLE','T4 (Thyroxine)','ug/dL','4.5','12.5',NULL,NULL,NULL,1,false),
  ('TSH_SINGLE','TSH','uIU/mL','0.35','5.50','Adult default',NULL,NULL,1,false),
  ('FT3','Free T3','pg/mL','2.0','4.4','Adult default',NULL,NULL,1,false),
  ('FT4','Free T4','ng/dL','0.8','1.8','Adult default',NULL,NULL,1,false),
  ('ANTI_TPO','Anti-TPO Antibody','IU/mL','0','35','Method dependent',NULL,NULL,1,false),
  ('TROP_I','Troponin-I','ng/mL','0','0.04','Method dependent',NULL,NULL,1,false),
  ('CK_MB','CK-MB','ng/mL','0','5.0','Method dependent',NULL,NULL,1,false),
  ('LDH','LDH','U/L','140','280','Adult default',NULL,NULL,1,false),
  ('NT_PROBNP','NT-proBNP','pg/mL',NULL,NULL,'Age dependent; interpret clinically',NULL,NULL,1,false),
  ('DDIMER','D-Dimer','ng/mL FEU','0','500','Method dependent',NULL,NULL,1,false),
  ('MP_MICRO','Malarial Parasite','',NULL,NULL,'Not seen','Not seen',NULL,1,false),
  ('MP_MICRO','Species','',NULL,NULL,'Not applicable','Not applicable',NULL,2,false),
  ('TYPHIDOT','Typhidot IgM','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('TYPHIDOT','Typhidot IgG','',NULL,NULL,'Negative','Negative',NULL,2,false),
  ('CHIKUNGUNYA','Chikungunya IgM','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('LEPTOSPIRA','Leptospira IgM','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('SCRUB_TYPHUS','Scrub Typhus IgM','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('COVID','COVID-19 Antigen','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('COVID','COVID-19 RT-PCR','',NULL,NULL,'Not Detected','Not Detected',NULL,2,false),
  ('INFLUENZA_AB','Influenza A','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('INFLUENZA_AB','Influenza B','',NULL,NULL,'Negative','Negative',NULL,2,false),
  ('RA_FACTOR','RA Factor','IU/mL','0','14','Negative: <14',NULL,NULL,1,false),
  ('CRP','CRP (C-Reactive Protein)','mg/L','0','6',NULL,NULL,NULL,1,false),
  ('ASO','ASO Titre','IU/mL','0','200','Adult default',NULL,NULL,1,false),
  ('ANA','ANA','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('ANTI_CCP','Anti-CCP','U/mL','0','20','Method dependent',NULL,NULL,1,false),
  ('HLA_B27','HLA-B27','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('HIV','HIV I & II','',NULL,NULL,'Non-Reactive','Non-Reactive',NULL,1,false),
  ('HBSAG','HBsAg','',NULL,NULL,'Non-Reactive','Non-Reactive',NULL,1,false),
  ('HCV','Anti-HCV','',NULL,NULL,'Non-Reactive','Non-Reactive',NULL,1,false),
  ('VDRL_SINGLE','VDRL','',NULL,NULL,'Non-Reactive','Non-Reactive',NULL,1,false),
  ('TPHA','TPHA','',NULL,NULL,'Non-Reactive','Non-Reactive',NULL,1,false),
  ('VIT_D','25-OH Vitamin D','ng/mL','30','100','Sufficiency: 30 - 100',NULL,NULL,1,false),
  ('VIT_B12','Vitamin B12','pg/mL','200','900','Adult default',NULL,NULL,1,false),
  ('FERRITIN','Ferritin','ng/mL',NULL,NULL,'Adult: male 30 - 400; female 13 - 150',NULL,NULL,1,false),
  ('FSH','FSH','mIU/mL',NULL,NULL,'Adult: male 1.5 - 12.4; female phase dependent',NULL,NULL,1,false),
  ('LH','LH','mIU/mL',NULL,NULL,'Adult: male 1.7 - 8.6; female phase dependent',NULL,NULL,1,false),
  ('PROLACTIN','Prolactin','ng/mL',NULL,NULL,'Adult: male 4 - 15; female 4 - 23',NULL,NULL,1,false),
  ('TESTOSTERONE','Testosterone','ng/dL',NULL,NULL,'Adult: male 300 - 1000; female 15 - 70',NULL,NULL,1,false),
  ('ESTROGEN','Estradiol (E2)','pg/mL',NULL,NULL,'Female cycle/menopause dependent',NULL,NULL,1,false),
  ('PROGESTERONE','Progesterone','ng/mL',NULL,NULL,'Female cycle/pregnancy dependent',NULL,NULL,1,false),
  ('CORTISOL','Cortisol','ug/dL','6.2','19.4','Morning adult default; time dependent',NULL,NULL,1,false),
  ('AMH','AMH','ng/mL',NULL,NULL,'Age dependent; interpret clinically',NULL,NULL,1,false),
  ('URINE_MICRO','Pus Cells','/HPF','0','2',NULL,NULL,NULL,1,false),
  ('URINE_MICRO','RBCs','/HPF','0','2',NULL,NULL,NULL,2,false),
  ('URINE_MICRO','Epithelial Cells','/HPF','0','5',NULL,NULL,NULL,3,false),
  ('URINE_CULTURE','Culture Result','',NULL,NULL,'No growth','No growth',NULL,1,false),
  ('URINE_CULTURE','Organism','',NULL,NULL,'Not isolated','Not isolated',NULL,2,false),
  ('URINE_CULTURE','Sensitivity','',NULL,NULL,'As applicable','As applicable',NULL,3,false),
  ('MICROALBUMIN','Urine Microalbumin','mg/L','0','20','Method dependent',NULL,NULL,1,false),
  ('PREG_TEST','Urine hCG','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('STOOL_ROUTINE','Colour','',NULL,NULL,'Brown','Brown',NULL,1,false),
  ('STOOL_ROUTINE','Consistency','',NULL,NULL,'Formed','Formed',NULL,2,false),
  ('STOOL_ROUTINE','Mucus','',NULL,NULL,'Absent','Absent',NULL,3,false),
  ('STOOL_ROUTINE','Blood','',NULL,NULL,'Absent','Absent',NULL,4,false),
  ('STOOL_OB','Occult Blood','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('STOOL_CULTURE','Culture Result','',NULL,NULL,'No enteric pathogen isolated','No enteric pathogen isolated',NULL,1,false),
  ('OVA_PARASITE','Ova','',NULL,NULL,'Not seen','Not seen',NULL,1,false),
  ('PT_INR','Prothrombin Time (PT)','sec','11','14','Method dependent',NULL,NULL,1,false),
  ('PT_INR','INR','','0.8','1.2','Not on anticoagulant therapy',NULL,NULL,2,false),
  ('APTT','APTT','sec','25','35','Method dependent',NULL,NULL,1,false),
  ('BT','Bleeding Time','min','2','7','Method dependent',NULL,NULL,1,false),
  ('CT','Clotting Time','min','5','15','Method dependent',NULL,NULL,1,false),
  ('FIBRINOGEN','Fibrinogen','mg/dL','200','400','Adult default',NULL,NULL,1,false),
  ('PSA','Total PSA','ng/mL','0','4.0','Adult male default',NULL,NULL,1,false),
  ('CEA','CEA','ng/mL','0','5.0','Non-smoker adult default; method dependent',NULL,NULL,1,false),
  ('CA125','CA-125','U/mL','0','35','Method dependent',NULL,NULL,1,false),
  ('CA199','CA 19-9','U/mL','0','37','Method dependent',NULL,NULL,1,false),
  ('AFP','AFP','ng/mL','0','10','Adult non-pregnant default',NULL,NULL,1,false),
  ('BETA_HCG','Beta-hCG','mIU/mL','0','5','Adult non-pregnant default',NULL,NULL,1,false),
  ('TOTAL_IGE','Total IgE','IU/mL','0','100','Adult default; method dependent',NULL,NULL,1,false),
  ('SPECIFIC_IGE','Allergen','',NULL,NULL,'Enter allergen name',NULL,NULL,1,false),
  ('SPECIFIC_IGE','Specific IgE','kUA/L','0','0.35','Class 0: <0.35',NULL,NULL,2,false),
  ('EOS_COUNT','Absolute Eosinophil Count','/cumm','40','440','Adult default',NULL,NULL,1,false),
  ('CALCIUM','S. Calcium','mg/dL','8.5','10.5',NULL,NULL,NULL,1,false),
  ('PHOSPHORUS','S. Phosphorus','mg/dL','2.5','4.5',NULL,NULL,NULL,1,false),
  ('MAGNESIUM','S. Magnesium','mg/dL','1.7','2.2','Adult default',NULL,NULL,1,false),
  ('IRON_STUDIES','S. Iron','ug/dL','60','170','Adult default',NULL,NULL,1,false),
  ('IRON_STUDIES','TIBC','ug/dL','250','400',NULL,NULL,NULL,2,false),
  ('IRON_STUDIES','Transferrin Saturation','%','20','50',NULL,NULL,NULL,3,false),
  ('IRON_STUDIES','Ferritin','ng/mL',NULL,NULL,'Adult: male 30 - 400; female 13 - 150',NULL,NULL,4,false),
  ('ZINC','Zinc','ug/dL','60','120','Adult default; method dependent',NULL,NULL,1,false),
  ('COPPER','Copper','ug/dL','70','140','Adult default; method dependent',NULL,NULL,1,false),
  ('HB_ELECTRO','HbA','%','95','98','Adult default',NULL,NULL,1,false),
  ('HB_ELECTRO','HbA2','%','2.0','3.5','Adult default',NULL,NULL,2,false),
  ('HB_ELECTRO','HbF','%','0','2.0','Adult default',NULL,NULL,3,false),
  ('G6PD','G6PD','U/g Hb',NULL,NULL,'Method dependent',NULL,NULL,1,false),
  ('SICKLE_CELL','Sickle Cell Screening','',NULL,NULL,'Negative','Negative',NULL,1,false),
  ('HPLC','HbA','%',NULL,NULL,NULL,NULL,NULL,1,false),
  ('HPLC','HbA2','%','2.0','3.5','Adult default',NULL,NULL,2,false),
  ('HPLC','HbF','%','0','2.0','Adult default',NULL,NULL,3,false),
  ('SEMEN','Volume','mL','1.5',NULL,'WHO lower reference: >=1.5',NULL,NULL,1,false),
  ('SEMEN','Sperm Count','million/mL','15',NULL,'WHO lower reference: >=15',NULL,NULL,2,false),
  ('SEMEN','Total Motility','%','40',NULL,'WHO lower reference: >=40',NULL,NULL,3,false),
  ('SPUTUM','Appearance','',NULL,NULL,'Mucoid','Mucoid',NULL,1,false),
  ('SPUTUM','AFB Stain','',NULL,NULL,'Negative','Negative',NULL,2,false),
  ('SPUTUM','Gram Stain','',NULL,NULL,'As applicable','As applicable',NULL,3,false)
),
test_ids AS (
  SELECT id, short_name FROM public.global_test_types WHERE department = 'pathology' AND short_name IS NOT NULL
)
INSERT INTO public.global_test_parameters (
  global_test_type_id, parameter_name, unit, ref_range_min, ref_range_max,
  ref_range_text, default_value, formula_key, sort_order, is_section_header
)
SELECT t.id, p.parameter_name, p.unit, p.ref_min, p.ref_max, p.ref_text, p.default_value, p.formula_key, p.sort_order, p.is_section_header
FROM params p
JOIN test_ids t ON lower(t.short_name) = lower(p.short_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.global_test_parameters existing
  WHERE existing.global_test_type_id = t.id
    AND lower(existing.parameter_name) = lower(p.parameter_name)
);

INSERT INTO public.branch_test_library_settings (lab_id, branch_id, global_test_type_id, is_enabled, price)
SELECT b.lab_id, b.id, g.id,
       g.short_name IN ('CBC','KFT','LFT','LIPID','WIDAL','URINE','SUGAR','THYROID','SEROLOGY','DENGUE_RAPID','BIO','RA_PANEL','MP_RAPID'),
       COALESCE(g.default_price, 0)
FROM public.branches b
CROSS JOIN public.global_test_types g
WHERE g.department = 'pathology'
  AND g.is_default_library = true
ON CONFLICT (branch_id, global_test_type_id) DO NOTHING;
