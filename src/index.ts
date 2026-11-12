import {
	defineComponent,
	h,
	onBeforeUnmount,
	onMounted,
	ref,
	watchEffect,
	type PropType,
} from 'vue'

import {
	attributesOf,
	EVENTS,
	networkAttributesOf,
	type ConnectProps,
	type NetworkProps,
	type ReclackConnectElement,
	type ReclackNetworkElement,
} from '@reclack/walletkit/element'
import type {
	ConnectRequest,
	ConnectResult,
	WalletKit,
	WalletKitTheme,
} from '@reclack/walletkit'

export type { ConnectProps, NetworkProps } from '@reclack/walletkit/element'

/**
 * The Reclack wallet picker, as a Vue component.
 *
 * Vue renders custom elements perfectly well on its own, given
 * `compilerOptions.isCustomElement`. This exists so a Vue application needs
 * no build configuration, gets typed props, and listens with `@connect` as it
 * would to any other component.
 *
 * Written with `h` rather than as a single-file component, so it ships as
 * plain JavaScript: a `.vue` file would make this package depend on Vue's
 * compiler and pin a major version of it.
 */
export const ReclackConnect = defineComponent({
	name: 'ReclackConnect',
	props: {
		kit: { type: Object as PropType<WalletKit>, default: undefined },
		request: { type: Object as PropType<ConnectRequest>, default: undefined },
		theme: { type: Object as PropType<WalletKitTheme>, default: undefined },
		variant: { type: String as PropType<'inline' | 'modal'>, default: undefined },
		family: { type: String as PropType<'evm' | 'svm'>, default: undefined },
		chainId: { type: Number, default: undefined },
		intent: {
			type: Array as PropType<Array<'address' | 'balance'>>,
			default: undefined,
		},
		keepAlive: { type: Boolean, default: false },
		themeMode: {
			type: String as PropType<'light' | 'dark' | 'system'>,
			default: undefined,
		},
		brand: { type: String, default: undefined },
		radius: { type: String, default: undefined },
		fontFamily: { type: String, default: undefined },
		assetBase: { type: String, default: undefined },
		apiUrl: { type: String, default: undefined },
	},
	emits: {
		connect: (result: ConnectResult) => Boolean(result),
		cancel: () => true,
		error: (message: string) => typeof message === 'string',
	},
	setup (props, { emit }) {
		const element = ref<ReclackConnectElement | null>(null)

		// Runs before the element's own deferred first render, so the kit is
		// in place by then and no throwaway one is built.
		watchEffect(() => {
			const node = element.value
			if (!node) {
				return
			}
			if (props.kit) {
				node.kit = props.kit
			}
			if (props.request) {
				node.request = props.request
			}
			node.theme = props.theme
		})

		// Listened for rather than declared as `onConnect` props: Vue derives
		// an event name from such a prop by case, and this element dispatches
		// `connect-error`, which has no camelCase spelling to derive from.
		const listeners: Array<readonly [string, EventListener]> = []

		onMounted(() => {
			const node = element.value
			if (!node) {
				return
			}
			for (const [event, prop] of Object.entries(EVENTS)) {
				const listener = (raw: Event) => {
					const detail = (raw as CustomEvent).detail
					if (prop === 'onError') {
						emit('error', detail?.message ?? 'Could not connect.')
					} else if (prop === 'onConnect') {
						emit('connect', detail)
					} else {
						emit('cancel')
					}
				}
				node.addEventListener(event, listener)
				listeners.push([event, listener] as const)
			}
		})

		onBeforeUnmount(() => {
			for (const [event, listener] of listeners) {
				element.value?.removeEventListener(event, listener)
			}
		})

		return () =>
			h('reclack-connect', {
				ref: element,
				...attributesOf(props as ConnectProps),
			})
	},
})

/**
 * The chain picker, as a component.
 *
 * Takes `networks` and `value` and emits `change`, which is what a Vue
 * component is expected to do. The element works directly too, but then the
 * compiler has to be told the tag is not a component and the value comes
 * back through `$event.detail` rather than as the payload.
 */
export const ReclackNetwork = defineComponent({
	name: 'ReclackNetwork',
	props: {
		networks: {
			type: [Array, String] as PropType<string[] | string>,
			default: undefined,
		},
		value: { type: String, default: undefined },
		label: { type: String, default: undefined },
		disabled: { type: Boolean, default: false },
		themeMode: {
			type: String as PropType<'light' | 'dark' | 'system'>,
			default: undefined,
		},
		brand: { type: String, default: undefined },
		radius: { type: String, default: undefined },
		fontFamily: { type: String, default: undefined },
		assetBase: { type: String, default: undefined },
		/** A theme carrying more than the four attributes can hold. */
		theme: { type: Object as PropType<WalletKitTheme>, default: undefined },
	},
	emits: {
		change: (network: string) => typeof network === 'string',
	},
	setup (props, { emit }) {
		const element = ref<ReclackNetworkElement | null>(null)
		let listener: ((event: Event) => void) | undefined

		// A property, not an attribute: a theme is an object.
		watchEffect(() => {
			if (element.value) {
				element.value.theme = props.theme
			}
		})

		onMounted(() => {
			const node = element.value
			if (!node) {
				return
			}
			listener = (raw: Event) => {
				emit('change', (raw as CustomEvent<{ network: string }>).detail.network)
			}
			node.addEventListener('change', listener)
		})

		onBeforeUnmount(() => {
			if (listener) {
				element.value?.removeEventListener('change', listener)
			}
		})

		return () =>
			h('reclack-network', {
				ref: element,
				...networkAttributesOf(props as NetworkProps),
			})
	},
})
