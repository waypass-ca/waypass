import { SectionTitle, Toggle } from './settingsShared'

export function NotificationsSection() {
  return (
    <div>
      <SectionTitle title="Email Notifications" description="Choose which events trigger an email to your inbox." />
      <div className="divide-y divide-line">
        <Toggle label="New case submitted" description="When a family completes the booking widget" defaultChecked />
        <Toggle label="Case status updated" description="When a crematorium updates an order status" defaultChecked />
        <Toggle label="Document uploaded" description="When a new document is added to a case" defaultChecked />
        <Toggle label="Case marked complete" description="When a case reaches the Complete stage" defaultChecked />
        <Toggle label="New crematorium partner request" description="When a crematorium applies to partner" />
        <Toggle label="Weekly revenue summary" description="Every Monday with last week's revenue totals" defaultChecked />
      </div>
    </div>
  )
}
