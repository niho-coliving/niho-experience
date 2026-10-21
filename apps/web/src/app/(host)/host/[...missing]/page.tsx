import { notFound } from "next/navigation";

/** Unknown /host/… URLs get the host 404 inside the host root layout. */
export default function HostMissingPage() {
  notFound();
}
