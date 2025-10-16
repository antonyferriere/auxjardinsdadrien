<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;


$recipient = 'auxjardinsdadrien@gmail.com';
$subject = '[auxjardinsdadrien.com] Demande de contact';

$fromAddress = 'no-reply@auxjardinsdadrien.com';
$fromName = "Aux Jardins d'Adrien";

$smtpHost = 'auxjardinsdadrien.com';
$smtpPort = 465;
$smtpUser = 'no-reply@auxjardinsdadrien.com';
$smtpPass = 'D({g4CbMEWAq';
$smtpTimeout = 15;


$acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
$requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
$wantsJson =
  stripos($acceptHeader, 'application/json') !== false ||
  strtolower($requestedWith) === 'xmlhttprequest';

if (function_exists('mb_internal_encoding')) {
  mb_internal_encoding('UTF-8');
}

$allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:9000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:9000',
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins, true)) {
  header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond($wantsJson, 405, ['success' => false, 'message' => 'Methode HTTP non autorisee.']);
}

$jsToken = isset($_POST['hp_js_token']) ? trim((string) $_POST['hp_js_token']) : '';
$honeypot = isset($_POST['contact_check']) ? (string) $_POST['contact_check'] : '';

if ($jsToken === '') {
  if ($honeypot !== '') {
    http_response_code(204);
    exit;
  }
} else {
  $_POST['contact_check'] = '';
}

unset($_POST['hp_js_token']);

$name = isset($_POST['name']) ? trim(strip_tags((string) $_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var((string) $_POST['email'], FILTER_VALIDATE_EMAIL) : false;
$phone = isset($_POST['phone']) ? trim(strip_tags((string) $_POST['phone'])) : '';
$message = isset($_POST['message']) ? trim(strip_tags((string) $_POST['message'])) : '';

if ($name === '' || $email === false || $message === '') {
  respond(
    $wantsJson,
    422,
    ['success' => false, 'message' => 'Les champs nom, email et message sont obligatoires.']
  );
}

$messageLength = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);
if ($messageLength > 4000) {
  respond(
    $wantsJson,
    413,
    ['success' => false, 'message' => 'Le message est trop long.']
  );
}

$normalizedPhone = $phone !== '' ? $phone : 'Non renseigne';

$bodyLines = [
  '<p><b>Nom : </b>' . $name . '<br>',
  '<b>Email : </b>' . $email . '<br>',
  '<b>Mobile : </b>' . $normalizedPhone . '</p>',
  '<p>' . nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_HTML5)) . '</p>'
];
$body = implode(PHP_EOL, $bodyLines);

$mailer = new PHPMailer(true);

try {
  $mailer->CharSet = 'UTF-8';
  $mailer->isSMTP();
  $mailer->Host = $smtpHost;
  $mailer->Port = $smtpPort;
  $mailer->SMTPAuth = true;
  $mailer->Username = $smtpUser;
  $mailer->Password = $smtpPass;

  $encryption = strtolower((string) (getenv('SMTP_ENCRYPTION') ?: 'smtps'));
  if ($encryption === 'none') {
    $mailer->SMTPSecure = false;
    $mailer->SMTPAutoTLS = false;
  } elseif ($encryption === 'starttls') {
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  } else {
    $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
  }


  $mailer->Timeout = max(5, $smtpTimeout);

  $mailer->setFrom($fromAddress, $fromName);
  $mailer->addAddress($recipient);
  $mailer->addReplyTo($email, $name);

  $mailer->Subject = $subject;
  $mailer->Body = $body;
  $mailer->AltBody = $body;

  $mailer->send();

  respond($wantsJson, 200, ['success' => true, 'message' => 'Merci, nous vous contactons rapidement.']);
} catch (MailException $exception) {
  error_log('[contact.php] PHPMailer exception: ' . $exception->getMessage());
}

respond(
  $wantsJson,
  500,
  ['success' => false, 'message' => "L'envoi de l'email a echoue. Veuillez reessayer plus tard."]
);

function respond(bool $wantsJson, int $statusCode, array $payload): void
{
  http_response_code($statusCode);

  if ($wantsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
  }

  header('Content-Type: text/html; charset=UTF-8');

  $title = $payload['success'] ?? false ? 'Message envoye' : 'Erreur lors de la soumission';
  $message = $payload['message'] ?? ($payload['success'] ?? false
    ? 'Votre message a ete envoye avec succes.'
    : "Une erreur est survenue lors de l'envoi de votre message.");

  echo '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>' .
    htmlspecialchars($title, ENT_QUOTES | ENT_HTML5) .
    '</title></head><body style="font-family: Arial, sans-serif; line-height:1.5; padding:2rem;">';
  echo '<p>' . htmlspecialchars($message, ENT_QUOTES | ENT_HTML5) . '</p>';
  echo '<p><a href="/contact">Retourner au formulaire de contact</a></p>';
  echo '</body></html>';
  exit;
}
