import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock } from "lucide-react";

interface DashboardProps {
  recentSermons: Array<{ title: string; date: string; content: string }>;
  onNewSermon: () => void;
  onViewSermon: (content: string) => void;
}

export const Dashboard = ({ recentSermons, onNewSermon, onViewSermon }: DashboardProps) => {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Menu Principal</h1>
        <p className="text-sm md:text-base text-muted-foreground">Bem-vindo ao SermonPro</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base md:text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <Card 
            className="p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={onNewSermon}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg">Novo Sermão</h3>
              <p className="text-sm text-muted-foreground">
                Crie um novo sermão para sua próxima pregação
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Sermons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold">Sermões Recentes</h2>
          {recentSermons.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">Ver todos →</Button>
          )}
        </div>
        
        {recentSermons.length === 0 ? (
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base">Nenhum sermão criado ainda</p>
              <p className="text-xs md:text-sm mt-1">Crie seu primeiro sermão para começar</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {recentSermons.map((sermon, index) => (
              <Card 
                key={index} 
                className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onViewSermon(sermon.content)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm md:text-base text-foreground">{sermon.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {sermon.date}
                    </p>
                  </div>
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
