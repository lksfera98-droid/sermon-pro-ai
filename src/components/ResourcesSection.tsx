import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, FileText, Book } from "lucide-react";

export const ResourcesSection = () => {
  const resources = [
    {
      title: "Estudos Bíblicos",
      description: "Acesse uma coleção completa de estudos bíblicos para enriquecer suas pregações",
      icon: BookOpen,
      url: "https://drive.google.com/drive/folders/1flw4GiezzOKyj_mk4jwZ7KUopT2w4xSs?usp=drive_link",
      color: "text-blue-600"
    },
    {
      title: "Dicionários Bíblicos",
      description: "Consulte dicionários bíblicos para aprofundar seu conhecimento teológico",
      icon: Book,
      url: "https://drive.google.com/drive/folders/1yQeQCGOoySz7Qerxn5Msj0YTJnir1kQC?usp=drive_link",
      color: "text-green-600"
    },
    {
      title: "Bíblias de Estudo",
      description: "Baixe diferentes versões de Bíblias de estudo para suas pesquisas",
      icon: FileText,
      url: "https://drive.google.com/drive/folders/1s4N47PQQz3Z335Kb7vLDgrmo5Udpj5-C?usp=drive_link",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Recursos Bíblicos</h1>
        <p className="text-muted-foreground">
          Acesse materiais complementares para enriquecer seus sermões
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className={`p-3 bg-accent rounded-lg w-fit ${resource.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </div>

                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full gap-2">
                    Acessar Recursos
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
