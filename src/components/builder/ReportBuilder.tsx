import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TopicsTab from "./tabs/TopicsTab";
import CompareTab from "./tabs/CompareTab";
import BuildReportTab from "./tabs/BuildReportTab";

/**
 * Journalist-friendly Report Builder.
 *
 *  - Topics:        guided entry — pick a topic, see who spends on it
 *  - Compare:       pick 2–4 things, see them side-by-side
 *  - Build report:  free-form pivot — filter, drag dimensions to break down,
 *                   rank, expand nested rows.  This is the discovery surface.
 */
export default function ReportBuilder() {
  return (
    <Tabs defaultValue="build" className="w-full">
      <TabsList className="h-auto flex-wrap justify-start gap-1 p-1 bg-muted/40">
        <TabsTrigger value="build" className="px-4 py-2">
          <span className="mr-1.5">🔧</span>Build a report
        </TabsTrigger>
        <TabsTrigger value="topics" className="px-4 py-2">
          <span className="mr-1.5">📚</span>By Topic
        </TabsTrigger>
        <TabsTrigger value="compare" className="px-4 py-2">
          <span className="mr-1.5">⚖️</span>Compare
        </TabsTrigger>
      </TabsList>

      <TabsContent value="build" className="mt-6">
        <BuildReportTab />
      </TabsContent>
      <TabsContent value="topics" className="mt-6">
        <TopicsTab />
      </TabsContent>
      <TabsContent value="compare" className="mt-6">
        <CompareTab />
      </TabsContent>
    </Tabs>
  );
}
