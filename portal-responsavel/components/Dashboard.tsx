import AlunoHeader from "@/components/AlunoHeader";
import GradesSection from "@/components/GradesSection";
import CalendarSection from "@/components/CalendarSection";

export default function Dashboard() {
  return (
    <div className="animate-fade-in-up">
      <AlunoHeader />
      <div className="space-y-7 px-5 pt-5">
        <GradesSection />
        <CalendarSection />
      </div>
    </div>
  );
}
