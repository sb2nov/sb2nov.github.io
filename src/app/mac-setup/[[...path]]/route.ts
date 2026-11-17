import { proxyMacSetup } from "@/lib/mac-setup-proxy";

// Proxies https://sourabhbajaj.com/mac-setup/* to the sb2nov/mac-setup GitHub Pages site.
export function GET(request: Request) {
	return proxyMacSetup(request);
}

export function HEAD(request: Request) {
	return proxyMacSetup(request);
}
