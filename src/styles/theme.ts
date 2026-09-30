export const theme = {
  color: {
    background: {
      page: '#EDEEF2',
      primary: '#FFFFFF',
      secondary: '#F5F7FA',
      card: '#FFFFFF',
      float: '#FFFFFF',
    },
    chat: {
      ground: '#FFFFFF',
    },
    bubble: {
      incoming: '#F2F2F2',
      outgoing: '#007AFF',
      outgoingText: '#FFFFFF',
    },
    accent: {
      default: '#007AFF',
      soft: 'rgba(0, 122, 255, 0.08)',
      border: 'rgba(0, 122, 255, 0.24)',
    },
    attention: '#FF303C',
    positive: '#1ABE43',
    badge: {
      fill: '#17181C',
      text: '#FFFFFF',
    },
    text: {
      primary: '#060708',
      secondary: 'rgba(6, 7, 8, 0.68)',
      tertiary: 'rgba(6, 7, 8, 0.52)',
      muted: 'rgba(6, 7, 8, 0.4)',
      onAccent: '#FFFFFF',
    },
    divider: {
      primary: 'rgba(12, 13, 14, 0.16)',
      secondary: 'rgba(12, 13, 14, 0.06)',
    },
  },
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    '2xl': '12px',
    '3xl': '16px',
    '4xl': '20px',
    round: '9999px',
  },
  shadow: {
    e1: '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    e3: '0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 0 2px 0 rgba(0, 0, 0, 0.08)',
    e3Single: '0 2px 12px 0 rgba(0, 0, 0, 0.12)',
  },
  font: {
    family: "Roboto, system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  },
  fontSize: {
    body: '16px',
    detail: '15px',
    description: '13px',
    label: '12px',
    note: '10px',
    chatHeaderTitle: '17px',
    chatListName: '14px',
    timestamp: '13px',
    bubbleMeta: '11px',
  },
  lineHeight: {
    body: '20px',
    chatHeaderTitle: '22px',
    chatListName: '18px',
    bubbleMeta: '16px',
  },
  layout: {
    railWidth: '77px',
    chatListWidth: '393px',
    chatListMinWidth: '260px',
    chatMaxWidth: '791px',
    bubbleMaxWidth: '480px',
    composerMaxWidth: '740px',
    avatarSize: '40px',
    headerActionSize: '32px',
  },
  transition: {
    fast: '120ms ease',
    base: '200ms ease',
  },
} as const

export type AppTheme = typeof theme

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
