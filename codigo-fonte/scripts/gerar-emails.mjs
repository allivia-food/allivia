import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

const directory = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../supabase/email-templates/', import.meta.url));
mkdirSync(directory, { recursive: true });
const formatOptions = await resolveConfig(
  fileURLToPath(new URL('../package.json', import.meta.url)),
);
async function writeHtml(name, html) {
  writeFileSync(resolve(directory, name), await format(html, { ...formatOptions, parser: 'html' }));
}
const templates = [
  {
    file: 'confirm-signup',
    subject: 'Confirme seu cadastro no Allivia',
    tag: 'CONFIRMAÇÃO DE CADASTRO',
    title: 'Seu cuidado começa aqui.',
    text: 'Falta só confirmar seu e-mail para começar. Digite este código na tela de confirmação de cadastro do aplicativo.',
    code: true,
  },
  {
    file: 'reset-password',
    subject: 'Seu código para recuperar a senha do Allivia',
    tag: 'RECUPERAÇÃO DE SENHA',
    title: 'Vamos recuperar seu acesso.',
    text: 'Recebemos uma solicitação para criar uma nova senha. Digite este código no Allivia para continuar com segurança.',
    code: true,
  },
  {
    file: 'magic-link',
    subject: 'Confirme a alteração de senha no Allivia',
    tag: 'VERIFICAÇÃO DE IDENTIDADE',
    title: 'Confirme que é você.',
    text: 'Para continuar com a alteração de senha solicitada no seu perfil, digite este código na tela de verificação do Allivia.',
    code: true,
  },
];
function render(template) {
  const token = '{{ .Token }}';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${template.subject}</title></head>
<body style="margin:0;padding:0;background-color:#FFF2E6;font-family:Arial,Helvetica,sans-serif;color:#222222;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${template.subject}. Cuide do seu acesso com segurança.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FFF2E6;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background-color:#FFFFFF;border-radius:24px;overflow:hidden;">
<tr><td style="padding:28px 32px;background-color:#4C532F;color:#FFFFFF;"><p style="margin:0;font-size:32px;font-weight:800;letter-spacing:-1px;">allivia<span style="color:#F68424;">.</span></p><p style="margin:8px 0 0;font-size:13px;line-height:20px;color:#EFFFE0;">Mais tranquilidade nas suas escolhas.</p></td></tr>
<tr><td style="padding:32px 32px 12px;"><p style="margin:0 0 14px;font-size:11px;line-height:18px;font-weight:700;letter-spacing:1.4px;color:#4C532F;">${template.tag}</p>
<h1 style="margin:0 0 18px;font-size:28px;line-height:36px;font-weight:700;color:#4C532F;">${template.title}</h1>
<p style="margin:0;font-size:16px;line-height:26px;">${template.text}</p></td></tr>
${template.code ? `<tr><td align="center" style="padding:20px 32px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:22px 8px;background-color:#EFFFE0;border:2px dashed #F68424;border-radius:16px;"><p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#4C532F;">SEU CÓDIGO DE VERIFICAÇÃO</p><p dir="ltr" style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:34px;line-height:44px;font-weight:700;letter-spacing:6px;color:#4C532F;">${token}</p></td></tr></table><p style="margin:14px 0 0;font-size:13px;line-height:21px;color:#62665A;">O código é temporário e só pode ser utilizado uma vez.<br>Não compartilhe seu código com ninguém.</p></td></tr>` : ''}
<tr><td style="padding:12px 32px 32px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:16px;background-color:#FFF2E6;border-radius:12px;"><p style="margin:0;font-size:13px;line-height:22px;color:#4C532F;">${template.warning || 'Se você não fez esta solicitação, ignore este e-mail. Não envie o código a outras pessoas. A equipe Allivia nunca pedirá sua senha por e-mail.'}</p></td></tr></table></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E9EBDD;"><p style="margin:0;font-size:12px;line-height:20px;color:#62665A;">Enviado automaticamente pelo Allivia.<br>Para obter ajuda, use a seção Ajuda no aplicativo. Não responda a este e-mail.</p></td></tr>
</table><p style="margin:20px 0 0;font-size:12px;line-height:20px;color:#4C532F;">Allivia · Cuidado em cada escolha.</p>
</td></tr></table></body></html>
`;
}
for (const template of templates) await writeHtml(`${template.file}.html`, render(template));
console.log('3 templates de e-mail gerados.');
