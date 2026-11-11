# @reclack/walletkit-vue

The Reclack wallet picker as a Vue component. Connect a wallet, read an
address, read a balance, on EVM chains and on Solana.

```sh
npm install @reclack/walletkit @reclack/walletkit-vue
```

`@reclack/walletkit` is a peer dependency, so install both. Vue 3.4 or newer.

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { ReclackConnect } from '@reclack/walletkit-vue'

const open = ref(false)
const address = ref('')

function onConnect (result) {
  address.value = result.address
  open.value = false
}
</script>

<template>
  <button v-if="!open" @click="open = true">Connect wallet</button>

  <ReclackConnect
    v-else
    variant="modal"
    family="evm"
    :chain-id="8453"
    :intent="['address']"
    @connect="onConnect"
    @cancel="open = false"
    @error="(message) => toast(message)"
  />
</template>
```

`variant="modal"` opens over the page and closes itself once a wallet
connects, so mounting it is how you open it. `variant="inline"` renders the
wallet list in place.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `variant` | `'inline' \| 'modal'` | `'inline'` | A list on the page, or the picker over it |
| `family` | `'evm' \| 'svm'` | `'evm'` | Which wallets to offer |
| `chain-id` | `number` | none | Require this chain, switching the wallet if needed |
| `intent` | `Array<'address' \| 'balance'>` | `['address']` | What to return |
| `keep-alive` | `boolean` | `false` | Stay connected after resolving |
| `asset-base` | `string` | `/images/` | Where the wallet logos are served from |
| `api-url` | `string` | Reclack's | A different deployment, such as a sandbox |
| `kit` | `WalletKit` | its own | A kit to share, see below |
| `request` | `ConnectRequest` | `{ intent: ['address'] }` | An intent carrying assets |
| `theme` | `WalletKitTheme` | none | Colours, radius and type. See [Theming](#theming) |

Anything that is not a string needs `v-bind`, so write `:chain-id="8453"`
rather than `chain-id="8453"`.

## Theming

```vue
<ReclackConnect
  :theme="{
    mode: 'system',               /* 'light' | 'dark' | 'system' */
    brand: '#ff6600',             /* worn by the primary action */
    radius: '14px',
    fontFamily: 'Inter, sans-serif',
    dark: { surface: '#000000' }, /* applied on top, in dark only */
  }"
/>
```

The four values most pages want also have a prop each, which build the same
theme:

| Prop | Theme field | Type | Default |
| --- | --- | --- | --- |
| `theme-mode` | `mode` | `'light' \| 'dark' \| 'system'` | `'system'` |
| `brand` | `brand` | `string`, as `#rrggbb` | Reclack's |
| `radius` | `radius` | `string` | `10px` |
| `font-family` | `fontFamily` | `string` | inherited |

**A `theme` wins over the four.** Passing `theme`, or sharing a `kit` that
already carries one, makes them ignored and uses the theme whole, so a page
that themed its kit does not have to theme every picker as well.

Colours must be `#rrggbb`. Anything else is ignored and the default stands, so
a value from an API response can never end up inside a style.

## Events

| Event | Payload |
| --- | --- |
| `@connect` | `{ address, chainId, walletId, name, family, balances }` |
| `@cancel` | nothing, the person closed the picker |
| `@error` | a message a person can read |

## Reading a balance

`intent` takes a list because an address and a balance are not alternatives.
Asking for a balance needs an asset to be a balance of, which is more than an
attribute can carry, so pass the whole request:

```vue
<ReclackConnect
  family="evm"
  :request="{
    intent: ['address', 'balance'],
    assets: [{ family: 'evm', chainId: 8453, token: USDC, decimals: 6 }],
  }"
  @connect="onConnect"
/>
```

Amounts come back as `bigint` in the asset's smallest unit. `formatUnits` from
`@reclack/walletkit` renders them.

## Sharing a kit

Each picker builds its own connection layer unless given one. A page with
several pickers should share, since discovery means a window listener and a
catalogue fetch.

```ts
// kit.ts, imported wherever a picker is rendered
import { createWalletKit } from '@reclack/walletkit'
export const kit = createWalletKit()
```

```vue
<ReclackConnect :kit="kit" family="evm" />
```

Themes stay per picker even when the kit is shared, so one kit can serve a
light picker in a panel and a dark one in a drawer.

## Nuxt and other frameworks that render on the server

Render the component on the client only, with `<ClientOnly>` in Nuxt.
`@reclack/walletkit` itself is safe to import on a server: it touches no
browser API until something subscribes, and registering the custom element is
skipped where there is no `customElements`.

## Without this package

The picker is a custom element, so Vue can use it directly if you would rather
not add a wrapper. Tell the compiler the tag is not a Vue component:

```ts
// vite.config.ts
vue({
  template: {
    compilerOptions: { isCustomElement: (tag) => tag === 'reclack-connect' },
  },
})
```

```vue
<reclack-connect family="evm" @connect="(e) => onConnect(e.detail)" />
```

This package exists so you do not have to do that, and so props and events
look like every other component in your app.

## TypeScript

Types ship with the package. Vue's language server also reads the
`custom-elements.json` in `@reclack/walletkit`, so the raw tag autocompletes
too.

```ts
import type { ConnectProps } from '@reclack/walletkit-vue'
import type { ConnectResult, WalletKit } from '@reclack/walletkit'
```

## Licence

MIT.
