import { RedirectPage } from "@/components/redirect-page";

// The Jekyll site redirected /projects to /work; keep old links working.
export default function ProjectsRedirect() {
	return <RedirectPage target="/work" />;
}
