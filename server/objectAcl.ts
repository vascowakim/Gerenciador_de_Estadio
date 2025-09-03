import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// O tipo do grupo de acesso.
//
// Pode ser definido de forma flexível de acordo com o caso de uso.
//
// Exemplos:
// - USER_LIST: os usuários de uma lista armazenada no banco de dados;
// - EMAIL_DOMAIN: os usuários cujo email está em um domínio específico;
// - GROUP_MEMBER: os usuários que são membros de um grupo específico;
// - SUBSCRIBER: os usuários que são assinantes de um serviço específico / criador
//   de conteúdo.
export enum ObjectAccessGroupType {}

// O grupo lógico de usuários que pode acessar o objeto.
export interface ObjectAccessGroup {
  // O tipo do grupo de acesso.
  type: ObjectAccessGroupType;
  // O ID lógico que é suficiente para identificar os membros qualificados do grupo.
  //
  // Pode ter formato diferente para tipos diferentes. Por exemplo:
  // - para USER_LIST, o id poderia ser o id da entidade de lista de usuários do bd, e a
  //   entidade de lista de usuários do bd poderia conter um monte de ids de usuários. O usuário precisa
  //   ser membro da lista de usuários para poder acessar o objeto.
  // - para EMAIL_DOMAIN, o id poderia ser o domínio do email, e o usuário precisa
  //   ter um email com o domínio para poder acessar o objeto.
  // - para GROUP_MEMBER, o id poderia ser o id da entidade de grupo do bd, e a
  //   entidade de grupo do bd poderia conter um monte de ids de usuários. O usuário precisa ser
  //   membro do grupo para poder acessar o objeto.
  // - para SUBSCRIBER, o id poderia ser o id da entidade de assinante do bd, e a
  //   entidade de assinante do bd poderia conter um monte de ids de usuários. O usuário precisa
  //   ser assinante para poder acessar o objeto.
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

// A política de ACL do objeto.
// Isso seria definido como parte dos metadados customizados do objeto:
// - chave: "custom:aclPolicy"
// - valor: string JSON do objeto ObjectAclPolicy.
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Verificar se a permissão solicitada é permitida com base na permissão concedida.
function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  // Usuários com permissões de leitura ou escrita podem ler o objeto.
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }

  // Apenas usuários com permissões de escrita podem escrever no objeto.
  return granted === ObjectPermission.WRITE;
}

// A classe base para todos os grupos de acesso.
//
// Diferentes tipos de grupos de acesso podem ser implementados de acordo com o caso de uso.
abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  // Verificar se o usuário é membro do grupo.
  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    // Implementar o caso para cada tipo de grupo de acesso para instanciar.
    //
    // Por exemplo:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

// Define a política de ACL nos metadados do objeto.
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Obtém a política de ACL dos metadados do objeto.
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Verifica se o usuário pode acessar o objeto.
export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // Quando esta função é chamada, a política de acl é necessária.
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Objetos públicos são sempre acessíveis para leitura.
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Controle de acesso requer o id do usuário.
  if (!userId) {
    return false;
  }

  // O proprietário do objeto sempre pode acessá-lo.
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Percorre as regras de ACL para verificar se o usuário tem a permissão necessária.
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}