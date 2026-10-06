import { EditBook } from "./edit-book";

export default async function EditBookPage(props: PageProps<"/books/[id]">) {
  const { id } = await props.params;
  const { created } = await props.searchParams;
  return <EditBook id={id} created={created === "1"} />;
}
