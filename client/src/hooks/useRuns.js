import { useCallback, useEffect, useState } from "react";
import { buildQuery, request } from "../lib/api.js";

const EMPTY_COUNTS = { all: 0, reproduced: 0, notReproduced: 0 };

/**
 * Everything the run table needs to know about the list: the query state
 * (filter, search, sort, page) and the page of results it produces.
 *
 * Sorting, filtering and paging all happen on the server, so the table holds
 * only one page at a time and the order stays correct across pages.
 */
export default function useRuns() {
  const [reproduced, setReproducedState] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [skip, setSkip] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [page, setPage] = useState({
    items: [],
    total: 0,
    counts: EMPTY_COUNTS,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // One request per keystroke otherwise. The applied value is what the query
  // uses, so the input itself stays responsive.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search.trim());
      setSkip(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const query = buildQuery({
          reproduced,
          search: appliedSearch,
          sort,
          order,
          skip,
        });
        const result = await request("/api/runs" + query);

        if (cancelled) {
          return;
        }

        // Deleting the last row of the last page leaves the viewer past the
        // end of the list, so step back to the last page that has rows.
        if (result.items.length === 0 && skip > 0 && result.total > 0) {
          setSkip(Math.floor((result.total - 1) / result.limit) * result.limit);
          return;
        }

        setPage(result);
      } catch (problem) {
        if (!cancelled) {
          setError(problem.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reproduced, appliedSearch, sort, order, skip, reloadKey]);

  const setReproduced = useCallback((value) => {
    setReproducedState(value);
    setSkip(0);
  }, []);

  // First click on a column sorts high to low, which is the useful direction
  // for accuracy. A second click flips it.
  const toggleSort = useCallback(
    (field) => {
      if (field === sort) {
        setOrder(order === "asc" ? "desc" : "asc");
      } else {
        setSort(field);
        setOrder("desc");
      }
      setSkip(0);
    },
    [sort, order]
  );

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const clearFilters = useCallback(() => {
    setReproducedState("");
    setSearch("");
    setAppliedSearch("");
    setSkip(0);
  }, []);

  // After logging a run, show it: newest first, nothing filtering it out.
  const showNewest = useCallback(() => {
    setSort("createdAt");
    setOrder("desc");
    setReproducedState("");
    setSearch("");
    setAppliedSearch("");
    setSkip(0);
    setReloadKey((key) => key + 1);
  }, []);

  return {
    page,
    loading,
    error,
    reproduced,
    setReproduced,
    search,
    setSearch,
    filtering: reproduced !== "" || appliedSearch !== "",
    clearFilters,
    sort,
    order,
    toggleSort,
    skip,
    setSkip,
    reload,
    showNewest,
  };
}
