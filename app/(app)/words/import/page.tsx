import { ImportClient } from './import-client';

export default function ImportPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Import words</h1>
        <p className="text-muted-foreground mt-1">
          Upload a JSON file to bulk-add words to your collection.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
