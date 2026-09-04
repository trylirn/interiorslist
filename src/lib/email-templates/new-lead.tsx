import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  studioName?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  location?: string
  projectType?: string
  rooms?: string
  budget?: string
  style?: string
  timeline?: string
  message?: string
  dashboardUrl?: string
}

const Field = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={field}>
      <span style={fieldLabel}>{label}: </span>
      {value}
    </Text>
  ) : null

const NewLeadEmail = ({
  studioName,
  clientName,
  clientEmail,
  clientPhone,
  location,
  projectType,
  rooms,
  budget,
  style,
  timeline,
  message,
  dashboardUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New enquiry from {clientName ?? 'a homeowner'} via Intearior</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>You have a new project enquiry</Heading>
        <Text style={text}>
          {studioName ? `Hi ${studioName}, a` : 'A'} homeowner reached out through your Intearior
          listing. Here are their details:
        </Text>
        <Section style={card}>
          <Field label="Name" value={clientName} />
          <Field label="Email" value={clientEmail} />
          <Field label="Phone" value={clientPhone} />
          <Field label="Location" value={location} />
          <Field label="Project type" value={projectType} />
          <Field label="Rooms" value={rooms} />
          <Field label="Budget" value={budget} />
          <Field label="Style" value={style} />
          <Field label="Timeline" value={timeline} />
          {message ? (
            <>
              <Hr style={hr} />
              <Text style={fieldLabel}>Their message</Text>
              <Text style={field}>{message}</Text>
            </>
          ) : null}
        </Section>
        {clientEmail ? (
          <Button style={button} href={`mailto:${clientEmail}`}>
            Reply to {clientName ?? 'the client'}
          </Button>
        ) : null}
        {dashboardUrl ? (
          <Text style={footer}>
            You can also view and manage this lead in{' '}
            <Link href={dashboardUrl} style={link}>
              your Intearior dashboard
            </Link>
            .
          </Text>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLeadEmail,
  subject: (d: Record<string, any>) =>
    `New project enquiry from ${d.clientName ?? 'a homeowner'}`,
  displayName: 'New lead notification',
  previewData: {
    studioName: 'Atelier Rowe',
    clientName: 'Jane Miller',
    clientEmail: 'jane@example.com',
    clientPhone: '(415) 555-0132',
    location: 'San Francisco, CA',
    projectType: 'Full home design',
    rooms: 'Living room, Kitchen',
    budget: '$50k–$100k',
    style: 'Modern',
    timeline: '1–3 months',
    message: "We're renovating our Victorian and need help with the main floor.",
    dashboardUrl: 'https://intearior.com/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 25px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#1a1a1a', marginBottom: '12px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '22px' }
const card = {
  backgroundColor: '#f7f5f2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}
const field = { fontSize: '14px', color: '#1a1a1a', margin: '6px 0' }
const fieldLabel = { fontSize: '13px', color: '#777777', fontWeight: 600 as const }
const hr = { borderColor: '#e5e0da', margin: '12px 0' }
const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '14px',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#777777', marginTop: '20px' }
const link = { color: '#1a1a1a', textDecoration: 'underline' }
