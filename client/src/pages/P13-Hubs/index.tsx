import { useDC } from '@/dc/runtime'
import Logic from './logic.js'
import View from './view'
import './style.css'

export default function P13HubsPage(props: Record<string, unknown>) {
  const v = useDC(Logic, props)
  return <View v={v} />
}
