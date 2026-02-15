import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = 'Page Not Found — LabFlow';
    // Add noindex meta tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');

    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    return () => {
      // Restore robots meta on unmount
      if (metaRobots) metaRobots.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('app.notFound.title')}</h1>
        <p className="text-xl text-muted-foreground mb-4">{t('app.notFound.message')}</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline">
          {t('app.notFound.returnHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
