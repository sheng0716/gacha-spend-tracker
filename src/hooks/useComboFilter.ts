import { useState } from 'react'

// AutoComplete 打开时会用输入框里当前的值当搜索词过滤选项，
// 如果字段本来就有值（比如币种默认 JPY，或编辑时游戏/商品已有名字），
// 一点开就只剩它自己一个选项。这里记录聚焦那一刻的值，只要还没开始输入，
// 就当作没有搜索词，显示全部选项。
export function useComboFilter(value: string) {
  const [focusValue, setFocusValue] = useState<string | null>(null)
  return {
    onFocus: () => setFocusValue(value),
    filterOption: (input: string, option?: { value?: string }) => {
      if (input === focusValue) return true
      return (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
    },
  }
}
