import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  actionUrl?: string
}

const AccountClosed = ({ name, actionUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We're sad to see you go — your Intearior account is closed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>We're sad to see you go{name ? `, ${name}` : ''}</Heading>
        <Text style={text}>
          Your Intearior account has been closed and your studio details removed. Thank you for the time you
          spent with us — it genuinely mattered.
        </Text>
        <Section style={card}>
          <Text style={item}>· Homeowners search Intearior every day looking for a studio like yours.</Text>
          <Text style={item}>· Listing is free, and enquiries land straight in your inbox.</Text>
          <Text style={item}>· Coming back takes a minute — sign up again and claim your studio.</Text>
        </Section>
        <Text style={text}>
          If something didn't work for you, just reply to this email. We read every message and we'd love the
          chance to put it right.
        </Text>
        <Button style={button} href={actionUrl ?? 'https://intearior.com/login?tab=business'}>
          Come back anytime
        </Button>
      </Container>
    </Body>
  </Html>
)

export const accountClosed = {
  component: AccountClosed,
  subject: "We're sad to see you go",
  displayName: 'Account closed — win-back',
  previewData: { name: 'Jane', actionUrl: 'https://intearior.com/login?tab=business' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const heading = { fontSize: '20px', margin: '0 0 12px', color: '#1c1917' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#292524', margin: '10px 0' }
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
