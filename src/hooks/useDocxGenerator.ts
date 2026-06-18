import { useState } from "react";
import toast from "react-hot-toast";

type DocumentType = "cv" | "cover_letter" | "both";

export function useDocxGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDocx(params: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userProfile: any;
    jobDescription: string;
    documentType: DocumentType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matchScoreResult?: any;
  }) {
    setIsGenerating(true);
    setError(null);
    const loadingToast = toast.loading("Génération de votre document professionnel...");

    try {
      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de génération");
      }

      // Téléchargement automatique du fichier .docx
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

      toast.success("Document généré avec succès !", { id: loadingToast });
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
