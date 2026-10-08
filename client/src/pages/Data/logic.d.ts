import type { DCLogic } from '@/dc/runtime'

declare const Logic: new (props: Record<string, unknown>) => DCLogic
export default Logic
