import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component scrolls the window to top on every route change.
 * Place this component inside BrowserRouter.
 */
export const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top with smooth behavior for modern browsers
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant" // Use "instant" for immediate scroll on navigation
        });
    }, [pathname]);

    return null;
};
