import { GraduationCap, Award, ExternalLink } from "lucide-react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import SectionHeader from "./SectionHeader";
import type { Education, Certification } from "../data/resume";

interface Props {
  education: Education[];
  certifications: Certification[];
}

function EducationCard({ edu, index }: { edu: Education; index: number }) {
  const { ref, style } = useScrollReveal({ variant: "slide-left", delay: index * 150 });
  return (
    <div
      ref={ref}
      style={style}
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
          <GraduationCap size={18} className="text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{edu.degree}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">{edu.school}</p>
          <p className="text-xs text-zinc-500 mt-1">{edu.graduationDate}</p>
        </div>
      </div>
    </div>
  );
}

function CertificationCard({ cert, index }: { cert: Certification; index: number }) {
  const { ref, style } = useScrollReveal({ variant: "slide-right", delay: index * 150 + 200 });
  return (
    <div
      ref={ref}
      style={style}
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="bg-amber-500/10 p-2 rounded-lg shrink-0">
          <Award size={18} className="text-amber-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{cert.name}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">{cert.issuer}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-zinc-500">{cert.date}</p>
            {cert.badgeUrl && (
              <a
                href={cert.badgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EducationSection({ education, certifications }: Props) {
  return (
    <section id="education" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Education column — slides from left */}
        <div>
          <SectionHeader icon={GraduationCap} title="Education" />
          <div className="space-y-3">
            {education.map((edu, i) => (
              <EducationCard key={edu.id} edu={edu} index={i} />
            ))}
          </div>
        </div>

        {/* Certifications column — slides from right */}
        <div>
          <SectionHeader icon={Award} title="Certifications" />
          <div className="space-y-3">
            {certifications.map((cert, i) => (
              <CertificationCard key={cert.id} cert={cert} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
