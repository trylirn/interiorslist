import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  title?: string
  lines?: string[]
  actionUrl?: string
  actionLabel?: string
}

const Alert = ({ title, lines, actionUrl, actionLabel }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title ?? 'New activity on Intearior'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{title ?? 'New activity on Intearior'}</Heading>
        <Section style={card}>
          {(lines ?? []).map((l, i) => (
            <Text key={i} style={item}>
              {l}
            </Text>
          ))}
        </Section>
        {actionUrl ? (
          <Button style={button} href={actionUrl}>
            {actionLabel ?? 'Open admin'}
          </Button>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const claimSubmittedAdmin = {
  component: Alert,
  subject: 'New studio claim awaiting review',
  displayName: 'Admin alert — new claim',
  previewData: {
    title: 'New studio claim awaiting review',
    lines: ['Studio: Studio Aurora', 'From: Jane Miller (jane@example.com)'],
    actionUrl: 'https://intearior.com/admin?tab=claims',
    actionLabel: 'Review claim',
  },
} satisfies TemplateEntry

export const submissionReceivedAdmin = {
  component: Alert,
  subject: 'New studio submission awaiting review',
  displayName: 'Admin alert — new submission',
  previewData: {
    title: 'New studio submission awaiting review',
    lines: ['Studio: Copper & Oak Interiors', 'City: Austin', 'From: hello@example.com'],
    actionUrl: 'https://intearior.com/admin?tab=submissions',
    actionLabel: 'Review submission',
  },
} satisfies TemplateEntry

export const businessSignupAdmin = {
  component: Alert,
  subject: 'New business account registered',
  displayName: 'Admin alert — new business account',
  previewData: {
    title: 'New business account registered',
    lines: ['Studio: Copper & Oak Interiors', 'City: Austin', 'Account: hello@example.com'],
    actionUrl: 'https://intearior.com/admin?tab=submissions',
    actionLabel: 'Open admin',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const heading = { fontSize: '20px', margin: '0 0 12px', color: '#1c1917' }
const card = { backgroundColor: '#faf9f7', borderRadius: '10px', padding: '12px 16px', margin: '12px 0' }
const item = { fontSize: '15px', margin: '4px 0', color: '#292524' }
const button = {
  backgroundColor: '#1c1917',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '11px 18px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
