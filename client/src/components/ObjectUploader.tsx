import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  allowedFileTypes?: string[];
}

/**
 * Componente de upload de arquivos que é renderizado como um botão e fornece uma interface modal
 * para gerenciamento de arquivos.
 * 
 * Recursos:
 * - Renderiza como um botão personalizável que abre um modal de upload
 * - Fornece interface modal para:
 *   - Seleção de arquivos
 *   - Visualização de arquivos
 *   - Acompanhamento do progresso do upload
 *   - Exibição do status do upload
 * 
 * O componente usa o Uppy internamente para lidar com toda a funcionalidade de upload.
 * Todos os recursos de gerenciamento de arquivos são tratados automaticamente pelo modal do Uppy.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB padrão
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  allowedFileTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: allowedFileTypes.length > 0 ? allowedFileTypes : undefined,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        locale={{
          strings: {
            // Tradução para português
            dropHereOr: 'Arraste arquivos aqui ou %{browse}',
            browse: 'navegue',
            uploadComplete: 'Upload concluído',
            uploadPaused: 'Upload pausado',
            resumeUpload: 'Retomar upload',
            pauseUpload: 'Pausar upload',
            retryUpload: 'Tentar novamente',
            cancelUpload: 'Cancelar upload',
            xFilesSelected: {
              0: '%{smart_count} arquivo selecionado',
              1: '%{smart_count} arquivos selecionados'
            },
            uploadingXFiles: {
              0: 'Enviando %{smart_count} arquivo',
              1: 'Enviando %{smart_count} arquivos'
            },
            processingXFiles: {
              0: 'Processando %{smart_count} arquivo',
              1: 'Processando %{smart_count} arquivos'
            },
            uploading: 'Enviando',
            complete: 'Concluído',
            uploadFailed: 'Falha no upload',
            paused: 'Pausado',
            retry: 'Tentar novamente',
            cancel: 'Cancelar',
            done: 'Concluído',
            removeFile: 'Remover arquivo',
            editFile: 'Editar arquivo',
            back: 'Voltar',
            addMore: 'Adicionar mais',
            importFrom: 'Importar de %{name}',
            closeModal: 'Fechar modal',
            save: 'Salvar',
            // Adicionais em português
            addMoreFiles: 'Adicionar mais arquivos',
            addingMoreFiles: 'Adicionando mais arquivos',
            discardChanges: 'Descartar alterações'
          }
        }}
        width={750}
        height={550}
      />
    </div>
  );
}