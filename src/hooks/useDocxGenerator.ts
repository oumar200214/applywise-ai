import { useState } from "react";
import toast from "react-hot-toast";

type DocumentType = "cv" | "cover_letter" | "both";

export function useDocxGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDocx(params: {
    documentType: DocumentType;
    // Contenu pré-généré depuis AIGenerationResponse — pas besoin de rappeler l'IA
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cvContent?: any;       // tailored_cv object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coverLetterContent?: any; // cover_letter object
  }) {
    setIsGenerating(true);
    setError(null);
    const loadingToast = toast.loading("Génération du document .docx...");

    try {
      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Cas plan insuffisant
        if (response.status === 403) {
          throw new Error("Export .docx réservé au plan Pro ou Premium. Passez à Pro pour débloquer.");
        }
        throw new Error(errorData.error || "Erreur de génération");
      }

      const blob = await response.blob();
      const filename = response.headers
        .get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] ?? "document.docx";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document téléchargé !", { id: loadingToast });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  }

  return { generateDocx, isGenerating, error };
}
