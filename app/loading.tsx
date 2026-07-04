import Loader from "@/components/Loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e6f3f1]">
      <Loader />
    </div>
  );
}