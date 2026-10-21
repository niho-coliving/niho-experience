import { notFound } from "next/navigation";

/**
 * With two root layouts ((site) and (host)) there is no app-level layout, so an
 * unmatched URL would get Next's bare 404. This keeps the site's own 404 page,
 * inside the site chrome, for every unknown traveler URL.
 */
export default function SiteMissingPage() {
  notFound();
}
