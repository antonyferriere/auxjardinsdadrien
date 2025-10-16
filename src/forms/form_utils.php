<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

const FORM_MAIL_SETTINGS = [
  'recipient' => 'auxjardinsdadrien@gmail.com',
  'fromAddress' => 'no-reply@auxjardinsdadrien.com',
  'fromName' => "Aux Jardins d'Adrien",
  'smtpHost' => 'auxjardinsdadrien.com',
  'smtpPort' => 465,
  'smtpUser' => 'no-reply@auxjardinsdadrien.com',
  'smtpPass' => 'D({g4CbMEWAq',
  'smtpTimeout' => 15,
];

const FORM_ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:9000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:9000',
];

/**
 * Determine if the current request expects a JSON response.
 */
function form_wants_json(): bool
{
  $acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
  $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

  return stripos($acceptHeader, 'application/json') !== false ||
    strtolower($requestedWith) === 'xmlhttprequest';
}

/**
 * Apply CORS headers for whitelisted origins.
 */
function form_handle_cors(): void
{
  if (!isset($_SERVER['HTTP_ORIGIN'])) {
    return;
  }

  $origin = $_SERVER['HTTP_ORIGIN'];
  if (!in_array($origin, FORM_ALLOWED_ORIGINS, true)) {
    return;
  }

  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

/**
 * Guard against non-POST requests.
 *
 * @param array $responseOptions Options forwarded to {@see form_respond} when the request method is invalid.
 *
 * @throws RuntimeException if the method is OPTIONS to allow early return.
 */
function form_guard_request(bool $wantsJson, array $responseOptions = []): void
{
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    throw new RuntimeException('options');
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    return;
  }

  form_respond(
    $wantsJson,
    405,
    ['success' => false, 'message' => 'Methode HTTP non autorisee.'],
    $responseOptions + ['returnPath' => '/contact']
  );
}

/**
 * Honeypot validation to mitigate bots.
 */
function form_validate_honeypot(array &$post, string $honeypotField = 'contact_check', string $tokenField = 'hp_js_token'): void
{
  $jsToken = isset($post[$tokenField]) ? trim((string) $post[$tokenField]) : '';
  $honeypot = isset($post[$honeypotField]) ? (string) $post[$honeypotField] : '';

  if ($jsToken === '') {
    if ($honeypot !== '') {
      http_response_code(204);
      throw new RuntimeException('honeypot');
    }
  } else {
    $post[$honeypotField] = '';
  }

  unset($post[$tokenField]);
}

/**
 * Build and configure a PHPMailer instance.
 *
 * @throws MailException
 */
function form_create_mailer(): PHPMailer
{
  static $mailer = null;

  if ($mailer instanceof PHPMailer) {
    return clone $mailer;
  }

  $settings = FORM_MAIL_SETTINGS;
  $mailer = new PHPMailer(true);

  $mailer->CharSet = 'UTF-8';
  $mailer->isSMTP();
  $mailer->Host = $settings['smtpHost'];
  $mailer->Port = $settings['smtpPort'];
  $mailer->SMTPAuth = true;
  $mailer->Username = $settings['smtpUser'];
  $mailer->Password = $settings['smtpPass'];

  $encryption = strtolower((string) (getenv('SMTP_ENCRYPTION') ?: 'smtps'));
  if ($encryption === 'none') {
    $mailer->SMTPSecure = false;
    $mailer->SMTPAutoTLS = false;
  } elseif ($encryption === 'starttls') {
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  } else {
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
  }

  $mailer->Timeout = max(5, (int) $settings['smtpTimeout']);
  $mailer->setFrom($settings['fromAddress'], $settings['fromName']);
  $mailer->addAddress($settings['recipient']);

  return clone $mailer;
}

/**
 * Send the email using a prepared mailer instance.
 */
function form_dispatch_mail(
  PHPMailer $mailer,
  string $subject,
  string $htmlBody,
  string $replyEmail,
  string $replyName
): void {
  $mailer->Subject = $subject;
  $mailer->Body = $htmlBody;
  $mailer->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], PHP_EOL, $htmlBody));

  if ($replyEmail !== '') {
    $mailer->clearReplyTos();
    $mailer->addReplyTo($replyEmail, $replyName !== '' ? $replyName : $replyEmail);
  }

  $mailer->send();
}

/**
 * Output a JSON or HTML response and terminate execution.
 *
 * @param array{
 *   returnPath?: string,
 *   returnLabel?: string,
 *   successTitle?: string,
 *   errorTitle?: string,
 *   successDefaultMessage?: string,
 *   errorDefaultMessage?: string
 * } $options
 */
function form_respond(bool $wantsJson, int $statusCode, array $payload, array $options = []): void
{
  http_response_code($statusCode);

  if ($wantsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
  }

  header('Content-Type: text/html; charset=UTF-8');

  $isSuccess = (bool) ($payload['success'] ?? false);
  $title = $isSuccess
    ? ($options['successTitle'] ?? 'Message envoye')
    : ($options['errorTitle'] ?? 'Erreur lors de la soumission');

  $message = $payload['message'] ?? ($isSuccess
    ? ($options['successDefaultMessage'] ?? 'Votre message a ete envoye avec succes.')
    : ($options['errorDefaultMessage'] ?? "Une erreur est survenue lors de l'envoi de votre message."));

  $returnPath = $options['returnPath'] ?? '/';
  $returnLabel = $options['returnLabel'] ?? 'Retourner au formulaire';

  echo '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>' .
    htmlspecialchars($title, ENT_QUOTES | ENT_HTML5) .
    '</title></head><body style="font-family: Arial, sans-serif; line-height:1.5; padding:2rem;">';
  echo '<h1 style="font-size:1.5rem; margin-bottom:1rem;">' .
    htmlspecialchars($title, ENT_QUOTES | ENT_HTML5) .
    '</h1>';
  echo '<p style="margin-bottom:1.5rem;">' .
    htmlspecialchars($message, ENT_QUOTES | ENT_HTML5) .
    '</p>';
  echo '<p><a href="' .
    htmlspecialchars($returnPath, ENT_QUOTES | ENT_HTML5) .
    '" style="color:#0a7cff; text-decoration:none;">' .
    htmlspecialchars($returnLabel, ENT_QUOTES | ENT_HTML5) .
    '</a></p>';
  echo '</body></html>';
  exit;
}
