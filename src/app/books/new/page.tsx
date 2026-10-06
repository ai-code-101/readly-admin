import type { Metadata } from "next";
import { BookForm } from "@/components/book-form";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Upload book" };

export default function NewBookPage() {
  return (
    <>
      <PageHeader
        title="Upload a book"
        subtitle="Start with the EPUB — title, author, synopsis, page count and cover are read from it automatically."
      />
      <BookForm />
    </>
  );
}
