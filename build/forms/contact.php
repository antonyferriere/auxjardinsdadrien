<?php

declare(strict_types=1);

require_once __DIR__ . '/form_utils.php';

use PHPMailer\PHPMailer\Exception as MailException;

$responseOptions = [
  'returnPath' => '/contact',
  'returnLabel' => 'Retourner au formulaire de contact',
  'successDefaultMessage' => 'Votre message a ete envoye avec succes.',
];

$wantsJson = form_wants_json();

if (function_exists('mb_internal_encoding')) {
  mb_internal_encoding('UTF-8');
}

form_handle_cors();

try {
  form_guard_request($wantsJson, $responseOptions);
} catch (RuntimeException $runtimeException) {
  if (in_array($runtimeException->getMessage(), ['options'], true)) {
    exit;
  }
  throw $runtimeException;
}

try {
  form_validate_honeypot($_POST);
} catch (RuntimeException $runtimeException) {
  if (in_array($runtimeException->getMessage(), ['honeypot'], true)) {
    exit;
  }
  throw $runtimeException;
}

$name = isset($_POST['name']) ? trim(strip_tags((string) $_POST['name'])) : '';
$email = isset($_POST['email']) ? filter_var((string) $_POST['email'], FILTER_VALIDATE_EMAIL) : false;
$phone = isset($_POST['phone']) ? trim(strip_tags((string) $_POST['phone'])) : '';
$message = isset($_POST['message']) ? trim(strip_tags((string) $_POST['message'])) : '';

if ($name === '' || $email === false || $message === '') {
  form_respond(
    $wantsJson,
    422,
    ['success' => false, 'message' => 'Les champs nom, email et message sont obligatoires.'],
    $responseOptions
  );
}

$messageLength = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);
if ($messageLength > 4000) {
  form_respond(
    $wantsJson,
    413,
    ['success' => false, 'message' => 'Le message est trop long.'],
    $responseOptions
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

$mailer = form_create_mailer();

try {
  form_dispatch_mail(
    $mailer,
    '[auxjardinsdadrien.com] Demande de contact',
    $body,
    (string) $email,
    $name
  );

  form_respond(
    $wantsJson,
    200,
    ['success' => true, 'message' => 'Merci, nous vous contactons rapidement.'],
    $responseOptions
  );
} catch (MailException $exception) {
  error_log('[contact.php] PHPMailer exception: ' . $exception->getMessage());
}

form_respond(
  $wantsJson,
  500,
  ['success' => false, 'message' => "L'envoi de l'email a echoue. Veuillez reessayer plus tard."],
  $responseOptions
);
