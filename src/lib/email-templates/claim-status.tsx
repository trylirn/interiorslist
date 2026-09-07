import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  contactName?: string
  studioName?: string
  note?: string
  actionUrl?: string
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 25px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#1a1a1a', marginBottom: '12px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '22px' }
const card = {
  backgroundColor: '#f7f5f2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
  fontSize: '14px',
  color: '#1a1a1a',
}
const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '14px',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#777777', marginTop: '24px' }

function Shell({
  preview,
  title,
  body,
  note,
  actionUrl,
  actionLabel,
}: {
  preview: string
  title: string
  body: React.ReactNode
  note?: string
  actionUrl?: string
  actionLabel: string
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          {body}
          {note ? (
            <Section style={card}>
              <Text style={{ ...text, color: '#1a1a1a', margin: 0 }}>{note}</Text>
            </Section>
          ) : null}
          {actionUrl ? (
            <Button style={button} href={actionUrl}>
              {actionLabel}
            </Button>
          ) : null}
          <Text style={footer}>— The Intearior team</Text>
        </Container>
      </Body>
    </Html>
  )
}

const greeting = (name?: string) => (name ? `Hi ${name},` : 'Hello,')

const ClaimReceived = ({ contactName, studioName, actionUrl }: Props) => (
  <Shell
    preview={`We received your claim for ${studioName ?? 'your studio'}`}
    title="We've received your claim"
    actionUrl={actionUrl}
    actionLabel="View your claim"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          Thanks for claiming <strong>{studioName ?? 'your studio'}</strong> on Intearior. Our team
          reviews claims within 1–2 business days and will email you as soon as there's an update.
        </Text>
      </>
    }
  />
)

const ClaimNeedsInfo = ({ contactName, studioName, note, actionUrl }: Props) => (
  <Shell
    preview={`We need a little more information about ${studioName ?? 'your claim'}`}
    title="We need a little more information"
    note={note}
    actionUrl={actionUrl}
    actionLabel="Reply to our team"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          Before we can approve your claim for <strong>{studioName ?? 'your studio'}</strong>, our
          team needs a little more from you:
        </Text>
      </>
    }
  />
)

const ClaimApproved = ({ contactName, studioName, note, actionUrl }: Props) => (
  <Shell
    preview={`Your claim for ${studioName ?? 'your studio'} is approved`}
    title="Your studio is yours to manage"
    note={note}
    actionUrl={actionUrl}
    actionLabel="Open your dashboard"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          Good news — your claim for <strong>{studioName ?? 'your studio'}</strong> has been
          approved. Sign in to add photos, services, business hours and to receive project
          enquiries.
        </Text>
      </>
    }
  />
)

const ClaimRejected = ({ contactName, studioName, note, actionUrl }: Props) => (
  <Shell
    preview={`An update on your claim for ${studioName ?? 'your studio'}`}
    title="We couldn't approve this claim"
    note={note}
    actionUrl={actionUrl}
    actionLabel="Respond to our team"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          We reviewed your claim for <strong>{studioName ?? 'your studio'}</strong> and weren't able
          to approve it this time. Here's why:
        </Text>
      </>
    }
  />
)

const previewData = {
  contactName: 'Jane Miller',
  studioName: 'Atelier Rowe',
  note: 'Please send a business licence or a photo of your studio signage.',
  actionUrl: 'https://intearior.com/dashboard',
}

export const claimReceived = {
  component: ClaimReceived,
  subject: (d: Record<string, any>) => `We received your claim for ${d.studioName ?? 'your studio'}`,
  displayName: 'Claim received',
  previewData,
} satisfies TemplateEntry

export const claimNeedsInfo = {
  component: ClaimNeedsInfo,
  subject: (d: Record<string, any>) => `More information needed for ${d.studioName ?? 'your claim'}`,
  displayName: 'Claim needs more information',
  previewData,
} satisfies TemplateEntry

export const claimApproved = {
  component: ClaimApproved,
  subject: (d: Record<string, any>) => `Your claim for ${d.studioName ?? 'your studio'} is approved`,
  displayName: 'Claim approved',
  previewData,
} satisfies TemplateEntry

export const claimRejected = {
  component: ClaimRejected,
  subject: (d: Record<string, any>) => `An update on your claim for ${d.studioName ?? 'your studio'}`,
  displayName: 'Claim not approved',
  previewData,
} satisfies TemplateEntry
