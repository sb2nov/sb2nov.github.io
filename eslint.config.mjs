import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const ignored = [
	".next/**",
	"node_modules/**",
	"public/**",
	"content/**",
	"readme_preview/**",
	"lighthouse_results/**",
	"_site/**",
	"coverage/**",
	".context/**",
];

const config = [
	...nextVitals,
	...nextTs,
	{
		ignores: ignored,
	},
	{
		rules: {
			"@next/next/no-img-element": "off",
		},
	},
];

export default config;
