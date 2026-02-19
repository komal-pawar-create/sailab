UPDATE landing_footer
SET brand_name = 'LabFlow',
    copyright_text = '© 2026 LabFlow. All rights reserved.',
    nav_links = '[
      {"label": "Features", "href": "#features"},
      {"label": "Pricing", "href": "#pricing"},
      {"label": "Demo", "href": "#demo"},
      {"label": "Product Tour", "href": "/product-tour"},
      {"label": "Blog", "href": "/blog"}
    ]'::jsonb
WHERE id = '330c6213-4415-46c5-a517-517c828a48ab';