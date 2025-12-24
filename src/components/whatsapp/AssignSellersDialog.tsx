import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AssignSellersDialogProps {
  connectionId: string;
  connectionName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  user_id: string;
}

interface Assignment {
  profile_id: string;
  is_primary: boolean;
}

export function AssignSellersDialog({
  connectionId,
  connectionName,
  isOpen,
  onClose,
}: AssignSellersDialogProps) {
  const { workspace } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && workspace?.id) {
      loadData();
    }
  }, [isOpen, workspace?.id, connectionId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          profiles!inner(id, full_name, user_id)
        `)
        .eq('workspace_id', workspace!.id);

      if (membersError) throw membersError;

      const teamMembers = membersData?.map((m: any) => ({
        id: m.profiles.id,
        full_name: m.profiles.full_name,
        user_id: m.profiles.user_id,
      })) || [];

      setMembers(teamMembers);

      // Load current assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('seller_whatsapp_assignments')
        .select('profile_id, is_primary')
        .eq('whatsapp_connection_id', connectionId);

      if (assignmentsError) throw assignmentsError;

      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os vendedores',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAssigned = (profileId: string) => {
    return assignments.some((a) => a.profile_id === profileId);
  };

  const isPrimary = (profileId: string) => {
    return assignments.find((a) => a.profile_id === profileId)?.is_primary || false;
  };

  const toggleAssignment = (profileId: string) => {
    if (isAssigned(profileId)) {
      setAssignments(assignments.filter((a) => a.profile_id !== profileId));
    } else {
      setAssignments([...assignments, { profile_id: profileId, is_primary: false }]);
    }
  };

  const togglePrimary = (profileId: string) => {
    setAssignments(
      assignments.map((a) =>
        a.profile_id === profileId ? { ...a, is_primary: !a.is_primary } : a
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Delete all current assignments
      await supabase
        .from('seller_whatsapp_assignments')
        .delete()
        .eq('whatsapp_connection_id', connectionId);

      // Insert new assignments
      if (assignments.length > 0) {
        const { error } = await supabase
          .from('seller_whatsapp_assignments')
          .insert(
            assignments.map((a) => ({
              whatsapp_connection_id: connectionId,
              profile_id: a.profile_id,
              is_primary: a.is_primary,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: 'Vendedores atualizados',
        description: 'As atribuições foram salvas com sucesso',
      });
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as atribuições',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Vendedores</DialogTitle>
          <DialogDescription>
            Selecione os vendedores que terão acesso a "{connectionName}"
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum membro encontrado no workspace
          </p>
        ) : (
          <div className="space-y-4 py-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={isAssigned(member.id)}
                    onCheckedChange={() => toggleAssignment(member.id)}
                  />
                  <Label htmlFor={`member-${member.id}`} className="cursor-pointer">
                    {member.full_name || 'Sem nome'}
                  </Label>
                </div>

                {isAssigned(member.id) && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`primary-${member.id}`}
                      checked={isPrimary(member.id)}
                      onCheckedChange={() => togglePrimary(member.id)}
                    />
                    <Label
                      htmlFor={`primary-${member.id}`}
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Principal
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
