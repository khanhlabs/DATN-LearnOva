import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./UseAuth.jsx";
import {
  addToWishlistApi,
  removeFromWishlistApi,
  getWishlistApi,
  getWishlistCourseIdsApi,
  checkIsInWishlistApi,
  getWishlistCountApi,
  syncWishlistApi,
} from "../api/WishlistApi.js";
import {
  getStoredWishlistItems,
  addStoredWishlistItem,
  removeStoredWishlistItem,
  isInStoredWishlist,
  getStoredWishlistCount,
  getStoredWishlistCourseIds,
  WISHLIST_UPDATED_EVENT,
} from "../utils/wishlistStorage.js";

/**
 * useWishlist hook
 * Manages wishlist state with dual support:
 * - When NOT authenticated: uses LocalStorage (wishlistStorage.js)
 * - When authenticated: uses backend API (WishlistApi.js)
 *
 * Returns:
 * - wishlist: array of wishlist items
 * - wishlistCourseIds: array of course IDs in wishlist
 * - isInWishlist(courseId): check if course is in wishlist
 * - addToWishlist(course): add course to wishlist
 * - removeFromWishlist(courseId): remove course from wishlist
 * - toggleWishlist(course): toggle course in/out of wishlist
 * - isLoading: loading state
 * - error: error message if any
 * - wishlistCount: number of items in wishlist
 * - syncToServer(courseIds): sync LocalStorage items to backend
 */
export const useWishlist = () => {
  const { isAuthenticated } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [wishlistCourseIds, setWishlistCourseIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load wishlist from appropriate source (LocalStorage or API)
   */
  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        // Load from backend
        const data = await getWishlistApi();
        setWishlist(data || []);

        // Also get course IDs for quick checks
        const ids = await getWishlistCourseIdsApi();
        setWishlistCourseIds(ids || []);
      } else {
        // Load from LocalStorage
        const storedItems = getStoredWishlistItems();
        setWishlist(storedItems);
        setWishlistCourseIds(storedItems.map((item) => item.id));
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setError(err.message || "Failed to load wishlist");

      // Fallback to LocalStorage if API fails
      if (isAuthenticated) {
        const storedItems = getStoredWishlistItems();
        setWishlist(storedItems);
        setWishlistCourseIds(storedItems.map((item) => item.id));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Check if course is in wishlist
   */
  const isInWishlist = useCallback(
    (courseId) => {
      return wishlistCourseIds.includes(courseId);
    },
    [wishlistCourseIds],
  );

  /**
   * Add course to wishlist
   */
  const addToWishlist = useCallback(
    async (course) => {
      try {
        setError(null);

        if (isAuthenticated) {
          // Add via API
          const result = await addToWishlistApi(course.id);

          // Reload wishlist to get latest data
          await loadWishlist();

          return result;
        } else {
          // Add to LocalStorage
          const result = addStoredWishlistItem(course);

          if (!result.alreadyInWishlist) {
            // Update state only if not already in wishlist
            setWishlist(result.items);
            setWishlistCourseIds(result.items.map((item) => item.id));
          }

          return result;
        }
      } catch (err) {
        console.error("Failed to add to wishlist:", err);
        setError(err.message || "Failed to add to wishlist");
        throw err;
      }
    },
    [isAuthenticated, loadWishlist],
  );

  /**
   * Remove course from wishlist
   */
  const removeFromWishlist = useCallback(
    async (courseId) => {
      try {
        setError(null);

        if (isAuthenticated) {
          // Remove via API
          await removeFromWishlistApi(courseId);

          // Reload wishlist to get latest data
          await loadWishlist();
        } else {
          // Remove from LocalStorage
          const updatedItems = removeStoredWishlistItem(courseId);
          setWishlist(updatedItems);
          setWishlistCourseIds(updatedItems.map((item) => item.id));
        }
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
        setError(err.message || "Failed to remove from wishlist");
        throw err;
      }
    },
    [isAuthenticated, loadWishlist],
  );

  /**
   * Toggle course in/out of wishlist
   */
  const toggleWishlist = useCallback(
    async (course) => {
      const courseId = course.id || course.courseId;

      if (isInWishlist(courseId)) {
        return removeFromWishlist(courseId);
      } else {
        return addToWishlist(course);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist],
  );

  /**
   * Get wishlist count
   */
  const wishlistCount = wishlist.length;

  /**
   * Sync wishlist from LocalStorage to backend
   * Used when user logs in
   */
  const syncToServer = useCallback(
    async (courseIds = null) => {
      if (!isAuthenticated) {
        console.warn("Cannot sync to server - user not authenticated");
        return;
      }

      try {
        setError(null);
        const idsToSync = courseIds || getStoredWishlistCourseIds();

        if (idsToSync.length === 0) {
          return { success: true, message: "No items to sync" };
        }

        const result = await syncWishlistApi(idsToSync);

        // Reload wishlist after sync
        await loadWishlist();

        return result;
      } catch (err) {
        console.error("Failed to sync wishlist to server:", err);
        setError(err.message || "Failed to sync wishlist");
        throw err;
      }
    },
    [isAuthenticated, loadWishlist],
  );

  /**
   * Load wishlist on mount and when authentication changes
   */
  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated, loadWishlist]);

  /**
   * Listen for LocalStorage changes (from other tabs or windows)
   */
  useEffect(() => {
    const handleStorageChange = () => {
      loadWishlist();
    };

    const handleCustomEvent = () => {
      loadWishlist();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleCustomEvent);
    };
  }, [loadWishlist]);

  return {
    wishlist,
    wishlistCourseIds,
    isLoading,
    error,
    wishlistCount,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    loadWishlist,
    syncToServer,
  };
};
