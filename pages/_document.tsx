import { Html, Head, Main, NextScript } from "next/document";

/**
 * Microsoft Clarity (session recordings and heatmaps) runs on the published
 * prototype only: the Pages build sets NEXT_PUBLIC_BASE_PATH, local
 * `next dev` does not, so local testing never lands in the recordings.
 */
const CLARITY = `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "z3opbynlm2");`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {process.env.NEXT_PUBLIC_BASE_PATH && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{ __html: CLARITY }}
          />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
