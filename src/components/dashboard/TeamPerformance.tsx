import { cn } from "@/lib/utils";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Loader2, Users } from "lucide-react";

const TeamPerformance = () => {
  const { members, isLoading } = useTeamMembers();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5 h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Performance do Time</h3>
          <p className="text-sm text-muted-foreground">Ranking de vendedores</p>
        </div>
      </div>

      <div className="space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum membro do time ainda</p>
            <p className="text-xs mt-1">Convide vendedores para ver a performance</p>
          </div>
        ) : (
          members.slice(0, 5).map((member, index) => (
            <div 
              key={member.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {member.profile?.avatar_url ? (
                    <img 
                      src={member.profile.avatar_url} 
                      alt={member.profile.full_name || 'Membro'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {(member.profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                  'bg-primary' // Online by default since we don't track this
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{member.profile?.full_name || 'Usuário'}</p>
                  <span className="text-sm font-bold text-primary capitalize">{member.role}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground">
                    📧 {member.profile?.full_name ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
              </div>
              
              {/* Ranking badge */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                index === 0 ? "bg-chart-yellow/20 text-chart-yellow" :
                index === 1 ? "bg-muted text-muted-foreground" :
                index === 2 ? "bg-chart-orange/20 text-chart-orange" :
                "bg-secondary text-muted-foreground"
              )}>
                {index + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamPerformance;
