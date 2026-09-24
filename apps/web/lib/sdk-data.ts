/**
 * SDK install and usage snippets.
 *
 * These are documentation, not API data: the SDK packages do not exist yet, so
 * the snippets are the shape each SDK is meant to ship with and are maintained
 * here until the packages publish their own. The connection values the screen
 * pairs them with — key, endpoints — come from the API, via
 * `environments.get(...).connection`.
 *
 * Every snippet evaluates `checkout-v2`, the flag used throughout the docs, so
 * the example and the rest of the product agree.
 */

export type SdkKey =
  | "node"
  | "python"
  | "go"
  | "react"
  | "java"
  | "ruby"
  | "php"
  | "dotnet";

/** Where a SDK evaluates flags: on a server, or in the browser. */
export type EvaluationScope = "Server-side" | "Client-side";

export interface SdkSnippet {
  /** Shell command that installs the package. */
  install: string;
  /** Creating the client, or mounting the provider. */
  initialize: string;
  /** Reading one flag with a fallback value. */
  evaluate: string;
}

export interface SdkOption {
  key: SdkKey;
  label: string;
  /** Shown in the Connection panel; drives which key the SDK needs. */
  scope: EvaluationScope;
  steps: SdkSnippet;
}

const sdkOptions: SdkOption[] = [
  {
    key: "node",
    label: "Node.js",
    scope: "Server-side",
    steps: {
      install: "npm install @dariise/node",
      initialize: `import { Dariise } from "@dariise/node";

const client = new Dariise({
  apiKey: process.env.DARIISE_API_KEY,
});`,
      evaluate: `const on = await client.getBoolean("checkout-v2", false);

if (on) renderNewCheckout();`,
    },
  },
  {
    key: "python",
    label: "Python",
    scope: "Server-side",
    steps: {
      install: "pip install dariise",
      initialize: `from dariise import Dariise

client = Dariise(api_key=os.environ["DARIISE_API_KEY"])`,
      evaluate: `on = client.get_boolean("checkout-v2", False)

if on:
    render_new_checkout()`,
    },
  },
  {
    key: "go",
    label: "Go",
    scope: "Server-side",
    steps: {
      install: "go get github.com/dariise/dariise-go",
      initialize: `client, err := dariise.New(os.Getenv("DARIISE_API_KEY"))
if err != nil {
    log.Fatal(err)
}`,
      evaluate: `on := client.GetBoolean("checkout-v2", false)

if on {
    renderNewCheckout()
}`,
    },
  },
  {
    key: "react",
    label: "React",
    scope: "Client-side",
    steps: {
      install: "npm install @dariise/react",
      initialize: `import { DariiseProvider } from "@dariise/react";

<DariiseProvider clientKey={process.env.NEXT_PUBLIC_DARIISE_CLIENT_KEY}>
  <App />
</DariiseProvider>`,
      evaluate: `const on = useFlag("checkout-v2", false);

return on ? <NewCheckout /> : <Checkout />;`,
    },
  },
  {
    key: "java",
    label: "Java",
    scope: "Server-side",
    steps: {
      install: `implementation("dev.dariise:dariise-java:1.0.0")`,
      initialize: `DariiseClient client = DariiseClient.builder()
    .apiKey(System.getenv("DARIISE_API_KEY"))
    .build();`,
      evaluate: `boolean on = client.getBoolean("checkout-v2", false);

if (on) renderNewCheckout();`,
    },
  },
  {
    key: "ruby",
    label: "Ruby",
    scope: "Server-side",
    steps: {
      install: "gem install dariise",
      initialize: `require "dariise"

client = Dariise::Client.new(api_key: ENV["DARIISE_API_KEY"])`,
      evaluate: `on = client.get_boolean("checkout-v2", false)

render_new_checkout if on`,
    },
  },
  {
    key: "php",
    label: "PHP",
    scope: "Server-side",
    steps: {
      install: "composer require dariise/dariise",
      initialize: `use Dariise\\Client;

$client = new Client(getenv("DARIISE_API_KEY"));`,
      evaluate: `$on = $client->getBoolean("checkout-v2", false);

if ($on) {
    renderNewCheckout();
}`,
    },
  },
  {
    key: "dotnet",
    label: ".NET",
    scope: "Server-side",
    steps: {
      install: "dotnet add package Dariise",
      initialize: `using Dariise;

var client = new DariiseClient(
    Environment.GetEnvironmentVariable("DARIISE_API_KEY"));`,
      evaluate: `var on = await client.GetBooleanAsync("checkout-v2", false);

if (on) RenderNewCheckout();`,
    },
  },
];

/** The SDK the screen opens on, matching the design. */
export const defaultSdkKey: SdkKey = "node";

/** Every SDK the screen offers, in the order the picker lists them. */
export function getSdkOptions(): SdkOption[] {
  return sdkOptions;
}

/** Look up one SDK by key; `null` when it does not exist. */
export function getSdk(key: string): SdkOption | null {
  return sdkOptions.find((option) => option.key === key) ?? null;
}
