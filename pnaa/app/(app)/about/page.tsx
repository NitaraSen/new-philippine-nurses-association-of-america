import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="About PNAA"
        description="Philippine Nurses Association of America"
      />

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The Philippine Nurses Association of America (PNAA) is a
            professional nursing organization that serves as the voice of
            Filipino-American nurses in the United States. Founded in 1979, PNAA
            is dedicated to upholding and promoting the professional image and
            welfare of its members.
          </p>
          <p>
            PNAA connects over 4,000 nurses across 55 chapters throughout the
            United States, fostering professional development, community
            outreach, and cultural exchange among Filipino-American nurses.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Our Vision</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            To be the leading professional nursing organization that promotes
            excellence in nursing practice, education, and research among
            Filipino-American nurses in the United States and globally.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              "Northeast Region",
              "Southeast Region",
              "Central Region",
              "Western Region",
              "Mid-Atlantic Region",
              "Southern Region",
            ].map((region) => (
              <div
                key={region}
                className="flex items-center gap-2 rounded-md border p-3"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{region}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-3">
            <div className="flex gap-4">
              <span className="font-semibold text-foreground min-w-[4rem]">
                1979
              </span>
              <p>PNAA was founded to unite Filipino-American nurses</p>
            </div>
            <Separator />
            <div className="flex gap-4">
              <span className="font-semibold text-foreground min-w-[4rem]">
                Today
              </span>
              <p>
                Over 4,000 members across 55 chapters serve communities
                throughout the United States
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapter Management Platform</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This platform streamlines member details, events, community
            outreach, and fundraising into a unified tool viewable at both the
            chapter and national level. Member and event data is synced from Wild
            Apricot, while fundraising and user-created content is managed
            entirely within the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
